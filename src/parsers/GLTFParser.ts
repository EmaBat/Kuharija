import { mat4, quat, vec3 } from "gl-matrix";
import { Transform, TransformType } from "../components/Transform.ts";
import { ColorMaterial, Material } from "../data/Material.ts";
import { Entity } from "../Entity.js";
import { Scene } from "../Scene.ts";
import { AccessorComponentTypeEnum, type AccessorType, type GlTF, type MeshPrimitive, type Node } from "./GLTFData.ts";
import { Camera } from "../components/Camera.js";
import { Mesh } from "../components/Mesh.ts";


export class GLTFParser {
    data: GlTF;
    buffers: Uint8Array[] = [];
    rootDirectory: string = "./";

    materials: Map<any, Material> = new Map();
    scenes: Map<any, Scene> = new Map();
    nodes: Map<any, Entity> = new Map();
    cameras: Map<any, Camera> = new Map();
    meshes: Map<any, Mesh[]> = new Map();
    accessors: Map<any, { data: Uint8Array<ArrayBuffer> | Int8Array<ArrayBuffer> | Int16Array<ArrayBuffer> | Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer> | Float32Array<ArrayBuffer>, count: number, numComponents: number }> = new Map();

    constructor() {
        this.data = {
            'asset': { version: '2.0' }
        };
    }

    async setJson(content: string, rootDirectory: string) {
        this.data = JSON.parse(content);
        this.rootDirectory = rootDirectory;
    }

    async setBinary(content: Uint8Array) {       
        const dataView = new DataView(content.buffer, content.byteOffset, content.byteLength);
        const magic = dataView.getUint32(0, true);
        const version = dataView.getUint32(4, true);
        const totalLength = dataView.getUint32(8, true);

        if (magic != 1179937895) {
            throw Error("GLTF Magic Error: Not a valid GLTF file!");
        }
        if (version != 2) {
            throw Error("GLTF Version Error: Unsupported GLTF version!");
        }
        if (totalLength > content.byteLength) {
            throw Error("GLTF Size Error: GLB length exceeds buffer size!");
        }

        const JSON_CHUNK_TYPE = 0x4e4f534a;
        const BIN_CHUNK_TYPE = 0x004e4942;

        let spec: string | undefined;
        let binaryChunks = [];

        let offset = 12;
        while (offset < totalLength) {
            const chunkLength = dataView.getUint32(offset, true);
            const chunkType = dataView.getUint32(offset + 4, true);
            const chunkStart = offset + 8;
            const chunkData = content.slice(chunkStart, chunkStart + chunkLength);

            if (chunkType == JSON_CHUNK_TYPE) {
                spec = new TextDecoder('utf-8').decode(chunkData);
            } else if (chunkType == BIN_CHUNK_TYPE) {
                binaryChunks.push(chunkData);
            }

            offset = chunkStart + chunkLength;
        }

        if (spec === undefined) {
            throw Error("GLTF Error: No JSON content!");
        }

        this.data = JSON.parse(spec);
        this.buffers = binaryChunks;
    }

    async parseScene(index: number) {
        if (!this.data.scenes) {
            return null;
        }

        const sceneSpec = this.data.scenes[index];
        const nodes = sceneSpec.nodes ? sceneSpec.nodes : [];
        
        const scene = new Scene();
        for (const nodeIndex of nodes) {
            const entity = await this.parseNode(nodeIndex);
            if (entity) {
                scene.addEntity(entity);
            }
        }

        return scene;
    }

    async parseNode(index: number) {
        if (!this.data.nodes) {
            return null;
        }

        const nodeSpec = this.data.nodes[index];
        if (this.nodes.has(nodeSpec)) {
            return this.nodes.get(nodeSpec)!;
        }

        const nodeEntity = new Entity();
        nodeEntity.name = nodeSpec.name ?? null;

        if (nodeSpec.mesh !== undefined) {
            const meshes = await this.parseMesh(nodeSpec.mesh);
            // TODO: Fix this
            const mesh = meshes[0];
            nodeEntity.addComponent(mesh);
        }
        
        if (nodeSpec.camera !== undefined) {
            const camera = this.parseCamera(nodeSpec.camera);
            if (camera) {
                nodeEntity.addComponent(camera);
            }
        }

        const transformComponent = this.parseTransform(nodeSpec);
        nodeEntity.addComponent(transformComponent);
        
        const childIndices = nodeSpec.children ? nodeSpec.children : [];
        for (const childIndex of childIndices) {
            const childEntity = await this.parseNode(childIndex);
            if (childEntity) {
                childEntity.parent = nodeEntity;
            }
        }

        this.nodes.set(nodeSpec, nodeEntity);
        return nodeEntity;
    }

    parseTransform(nodeSpec: Node) {
        let translation: vec3;
        let rotation: quat;
        let scale: vec3;
        if (nodeSpec.matrix) {
            let matrix = mat4.fromValues(...nodeSpec.matrix);
            translation = mat4.getTranslation(vec3.create(), matrix);
            rotation = mat4.getRotation(quat.create(), matrix);
            scale = mat4.getScaling(vec3.create(), matrix);
        } else {
            const t = nodeSpec.translation ?? [0, 0, 0];
            const r = nodeSpec.rotation ?? [0, 0, 0, 1];
            const s = nodeSpec.scale ?? [1, 1, 1];
            translation = vec3.fromValues(...t);
            rotation = quat.fromValues(...r);
            scale = vec3.fromValues(...s);
        }
        const transformComponent = new Transform(TransformType.Free);
        transformComponent.location = translation;
        transformComponent.rotation = rotation;
        transformComponent.scale = scale;
        return transformComponent;
    }

    parseCamera(index: number) {
        if (!this.data.cameras) {
            return null;
        }

        let cameraSpec = this.data.cameras[index];
        if (this.cameras.has(cameraSpec)) {
            return this.cameras.get(cameraSpec)!;
        }

        if (cameraSpec.type === 'orthographic' || !cameraSpec.perspective) {
            console.warn("GLTF: Orhtographic camera is not supported!");
            return new Camera(1, 2 / Math.PI, 0.1, 100.0);
        }

        let aspect = cameraSpec.perspective.aspectRatio ?? 1.0;
        let fovy = cameraSpec.perspective.yfov;
        let znear = cameraSpec.perspective.znear;
        let zfar = cameraSpec.perspective.zfar ?? 100.0;
        let camera = new Camera(aspect, fovy, znear, zfar);

        this.cameras.set(cameraSpec, camera);
        return camera;
    }

    async parseMesh(index: number) {
        if (!this.data.meshes) {
            return [];
        }

        let meshSpec = this.data.meshes[index];
        if (this.meshes.has(meshSpec)) {
            return this.meshes.get(meshSpec)!;
        }

        const meshes: Mesh[] = [];
        for (const primitive of meshSpec.primitives) {
            const mesh = await this.parseMeshPrimitive(primitive);
            if (mesh) {
                meshes.push(mesh);
            }
        }

        this.meshes.set(meshSpec, meshes);
        return meshes;
    }

    async parseMeshPrimitive(primitive: MeshPrimitive) {
        const mode = primitive.mode ?? 4;
        if (mode !== 4) {
            console.warn(`GLTF: Unsupported primitive mode ${mode} on mesh, skipping...`);
            return null;
        }

        // Positions

        const positionIndex = primitive.attributes['POSITION'];
        if (positionIndex === undefined) {
            console.warn("GLTF: Mesh does not have position attribute, skipping...");
            return null;
        }
        const positions = await this.parseAccessor(positionIndex);
        if (!positions) {
            console.warn("GLTF: Could not get positions");
            return null;
        }
        const vertexCount = positions.count;

        // Indices

        let indices: Uint32Array | Uint16Array;
        if (primitive.indices !== undefined) {
            const accessor = await this.parseAccessor(primitive.indices);
            if (!accessor) {
                console.warn("Could not get mesh indices");
                return null;
            }
            indices = accessor.data as Uint16Array;
        } else {
            indices = Uint32Array.from({ length: vertexCount }, (_, index) => index);
        }

        // Optional attributes

        const normals = primitive.attributes['NORMAL'] !== undefined
            ? await this.parseAccessor(primitive.attributes['NORMAL'])
            : null;

        const textureCoordinates = primitive.attributes['TEXCOORD_0'] !== undefined
            ? await this.parseAccessor(primitive.attributes['TEXCOORD_0'])
            : null;

        const tangents = primitive.attributes['TANGENT'] !== undefined
            ? await this.parseAccessor(primitive.attributes['TANGENT'])
            : null;
        
        // Into a single 
        
        const vertices = new Float32Array(vertexCount * 11);
        for (let i = 0; i < vertexCount; i++) {
            const vertexStart = i * 11;
            
            for (let c = 0; c < 3; c++) {
                vertices[vertexStart + c] = positions.data[i * 3 + c];
            }
            if (normals) {
                for (let c = 0; c < 3; c++) {
                    vertices[vertexStart + 3 + c] = normals.data[i * 3 + c];
                }
            }
            if (textureCoordinates) {
                for (let c = 0; c < 2; c++) {
                    vertices[vertexStart + 6 + c] = textureCoordinates.data[i * 2 + c];
                }
            }
            if (tangents) {
                for (let c = 0; c < 3; c++) {
                    vertices[vertexStart + 8 + c] = tangents.data[i * 3 + c];
                }
            }
        }

        const material = primitive.material !== undefined
            ? this.parseMaterial(primitive.material)
            : new ColorMaterial();

        return new Mesh(vertices, indices, material);
    }

    async parseAccessor(index: number) {
        if (!this.data.accessors) {
            return null;
        }

        const accessorSpec = this.data.accessors[index];
        if (this.accessors.has(accessorSpec)) {
            return this.accessors.get(accessorSpec)!;
        }

        const numComponents = COMPONENTS_IN_TYPE[accessorSpec.type];
        const arrayConstructor = ARRAY_TYPE_BY_COMPONENT[accessorSpec.componentType];
        const componentSize = COMPONENT_SIZE[accessorSpec.componentType];
        const componentMax = COMPONENT_TYPE_MAX[accessorSpec.componentType];

        const count = accessorSpec.count;
        const arraySize = count * numComponents;
        const data = new arrayConstructor(arraySize);

        if (accessorSpec.sparse) {
            console.warn("GLTF: Sparse accessors not supported");
            return { data, count, numComponents };
        }

        if (accessorSpec.bufferView === undefined) {
            console.warn("GLTF: Accessor has no buffer view");
            return { data, count, numComponents };
        }

        if (!this.data.bufferViews) {
            console.warn("GLTF: No buffer views in the file");
            return { data, count, numComponents };
        }

        const viewSpec = this.data.bufferViews[accessorSpec.bufferView];
        const buffer = await this.getBuffer(viewSpec.buffer);
        if (!buffer) {
            console.warn("GLTF: Buffer missing!")
            return { data, count, numComponents };
        }
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

        const elementSize = componentSize * numComponents;
        const stride = viewSpec.byteStride ?? elementSize;
        const start = (viewSpec.byteOffset ?? 0) + (accessorSpec.byteOffset ?? 0);
        const normalized = accessorSpec.normalized === true && componentMax > 0;

        let dataSize = start + count * stride;
        if (count > 0 && dataSize > buffer.byteLength) {
            throw Error(`GLTF: Accessor ${accessorSpec.name} exceeds buffer size!`);
        }

        for (let i = 0; i < count; i++) {
            const elementOffset = start + i * stride;
            for (let componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                let value: number;
                
                let offset = elementOffset + componentIndex * componentSize;
                switch(accessorSpec.componentType) {
                    case AccessorComponentTypeEnum.Byte:
                        value = view.getInt8(offset);
                        break;
                    case AccessorComponentTypeEnum.UnsignedByte:
                        value = view.getUint8(offset);
                        break;
                    case AccessorComponentTypeEnum.Short:
                        value = view.getInt16(offset, true);
                        break;
                    case AccessorComponentTypeEnum.UnsignedShort:
                        value = view.getUint16(offset, true);
                        break;
                    case AccessorComponentTypeEnum.UnsignedInt:
                        value = view.getUint32(offset, true);
                        break;
                    default:
                        value = view.getFloat32(offset, true);
                }

                if (normalized) {
                    value = Math.max(value / componentMax, -1);
                }
                data[i * numComponents + componentIndex] = value;
            }
        }

        return { data, count, numComponents };
    }

    async getBuffer(index: number) {
        const cached = this.buffers[index];
        if (cached) {
            return cached;
        }

        if (!this.data.buffers) {
            return null;
        }

        let bufferSpec = this.data.buffers[index];
        if (!bufferSpec.uri) {
            return this.buffers[0];
        }

        if (bufferSpec.uri.startsWith('data:')) {
            const base64 = bufferSpec.uri.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            this.buffers[index] = bytes;
            return bytes;
        } else {
            let filepath = this.rootDirectory + (bufferSpec.uri);
            const content = await fetch(filepath).then((r) => {
                if (!r.ok) {
                    console.warn(`GLTF: Could not load buffer: ${r.statusText}`);
                    return new Uint8Array(0).buffer;
                }
                return r.arrayBuffer();
            });
            const buffer = new Uint8Array(content);
            this.buffers[index] = buffer;
            return buffer;
        }
    }

    parseMaterial(index: number) {
        if (!this.data.materials) {
            console.warn("No materials found in GLTF");
            return new ColorMaterial();
        }

        const materialSpec = this.data.materials[index];
        if (this.materials.has(materialSpec)) {
            return this.materials.get(materialSpec)!;
        }
        
        const material = new ColorMaterial();
        const pbrSpec = materialSpec.pbrMetallicRoughness;
        if (pbrSpec && pbrSpec.baseColorFactor) {
            material.baseColor = pbrSpec.baseColorFactor;
        }

        this.materials.set(materialSpec, material);
        return material;
    }
}


const COMPONENTS_IN_TYPE: Record<string, number> = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};


const ARRAY_TYPE_BY_COMPONENT = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
};


const COMPONENT_SIZE = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4
};


const COMPONENT_TYPE_MAX = {
    5120: 127,
    5121: 255,
    5122: 32767,
    5123: 65535,
    5125: 0,
    5126: 0
};

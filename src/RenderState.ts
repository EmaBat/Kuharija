import type { UnlitRenderer } from "./renderers/UnlitRenderer.ts";


export interface RenderTexture {
    texture: GPUTexture;
    view: GPUTextureView;
}


export class RenderState {
    device: GPUDevice;

    // Canvas

    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    canvasFormat: GPUTextureFormat;

    // Textures

    renderTextures: Map<string, RenderTexture> = new Map();

    // Renderers

    unlitRenderer: UnlitRenderer | null = null;


    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        this.device = device;
        this.canvas = canvas;

        const context = this.canvas.getContext('webgpu');
        if (!context) {
            throw Error("Could not get WebGPU context!");
        }

        this.context = context;
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.canvasFormat
        });
    }

    getRenderTexture(name: string) {
        const texture = this.renderTextures.get(name);
        if (!texture) {
            const textureNames = [];
            for (const textureName of this.renderTextures.keys()) {
                textureNames.push(textureName);
            }
            throw Error(`Texture ${name} does not exist. Available: ${textureNames}`);
        }
        return texture;
    }
/* 
    getModelBuffer(entity: Entity) {
        return this.modelBuffers.get(entity);
    }

    getMaterialBuffer(entity: Entity) {
        return this.materialBuffers.get(entity);
    }

    addModelBuffer(entity: Entity) {
        const mesh = entity.getComponent(Mesh);
        if (!mesh) {
            return;
        }
        const transform = entity.getComponent(Transform);
        if (!transform) {
            console.warn("Model does not contain Transform component. Skipping...");
            return;
        }
        const buffer = this.device.createBuffer({
            label: 'ModelBuffer',
            size: 64, // Model matrix
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
        });
        this.modelBuffers.set(entity, buffer);
        this.device.queue.writeBuffer(buffer, 0, transform.worldMatrix);
    }

    addMaterialBuffer(entity: Entity) {
        const mesh = entity.getComponent(Mesh);
        if (!mesh) {
            return;
        }
        if (mesh.material instanceof ColorMaterial) {
            const buffer = this.device.createBuffer({
                label: 'MaterialBuffer',
                size: 16, // Base color
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
            });
            this.materialBuffers.set(entity, buffer);
            this.device.queue.writeBuffer(buffer, 0, mesh.material.baseColor);
        }
    }

    addPipeline(name: string, pipelineData: PipelineData) {
        this.pipelines.set(name, pipelineData);
    }
 */
    createDepthTexture(name: string) {
        const texture = this.device.createTexture({
            label: 'sceneDepthTexture',
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        const view = texture.createView();
        this.renderTextures.set(name, { texture, view });
        return texture;
    }
/* 
    addIndexVertexBuffer(entity: Entity) {
        const mesh = entity.getComponent(Mesh);
        if (!mesh) {
            return;
        }
        const vertexBuffer = this.device.createBuffer({
            size: mesh.vertices.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
        });
        const indexBuffer = this.device.createBuffer({
            size: mesh.indices.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX
        });
        this.vertexBuffers.set(entity, vertexBuffer);
        this.indexBuffers.set(entity, indexBuffer);

        this.device.queue.writeBuffer(vertexBuffer, 0, mesh.vertices);
        this.device.queue.writeBuffer(indexBuffer, 0, mesh.indices);
    }

    setActiveCamera(entity: Entity) {
        if (!entity.getComponent(Camera)) {
            console.warn("Provided entity is not a valid camera, ignoring...");
            return;
        }
        this.activeCamera = entity;
    } */
}
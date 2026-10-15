import { Camera } from "../components/Camera.ts";
import { Mesh } from "../components/Mesh.ts";
import { Skin } from "../components/Skin.ts";
import { Transform } from "../components/Transform.ts";
import { BasicMaterial, Material } from "../data/Material.ts";
import type { Entity } from "../Entity.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";
import shaderCode from "../shaders/Unlit.wgsl?raw";


export class UnlitRenderer {
    pipeline: GPURenderPipeline;
    skinnedPipeline: GPURenderPipeline;

    frameBindGroup: GPUBindGroup;
    modelBindGroups: Map<Entity, GPUBindGroup> = new Map();
    materialBindGroups: Map<Material, GPUBindGroup> = new Map();
    skinBindGroups: Map<Entity, GPUBindGroup> = new Map();

    constructor(
        scene: Scene,
        camera: Entity,
        depthTextureFormat: GPUTextureFormat,
        outputTextureFormat: GPUTextureFormat,
        renderState: RenderState
    ) {
        // Bind Group Layouts

        const cameraBindGroupLayout = renderState.device.createBindGroupLayout({
            label: 'UnlitCameraLayout',
            entries: [{
                binding: 0,  // View + Projection matrix
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        const modelBindGroupLayout = renderState.device.createBindGroupLayout({
            label: 'UnlitModelLayout',
            entries: [{
                binding: 0, // Model matrix
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        const materialBindGroupLayout = renderState.device.createBindGroupLayout({
            label: 'UnlitMaterialLayout',
            entries: [
                {
                    binding: 0,  // Material uniforms
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'unfilterable-float',
                        viewDimension: '2d',
                        multisampled: false
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'non-filtering'
                    }
                }
            ]
        });

        const skinBindGroupLayout = renderState.device.createBindGroupLayout({
            label: 'UnlitSkinLayout',
            entries: [{
                binding: 0, // Joint matrices
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' }
            }]
        });

        // Pipeline

        const pipelineLayout = renderState.device.createPipelineLayout({
            bindGroupLayouts: [
                cameraBindGroupLayout,
                modelBindGroupLayout,
                materialBindGroupLayout
            ]
        });

        const skinnedPipelineLayout = renderState.device.createPipelineLayout({
            bindGroupLayouts: [
                cameraBindGroupLayout,
                modelBindGroupLayout,
                materialBindGroupLayout,
                skinBindGroupLayout
            ]
        });

        const shaderModule = renderState.device.createShaderModule({
            label: 'UnlitShader',
            code: shaderCode
        });
        const vertexLayout: GPUVertexBufferLayout = {
            arrayStride: 44,
            attributes: [
                {
                    shaderLocation: 0,  // Position
                    format: 'float32x3',
                    offset: 0,
                },
                {
                    shaderLocation: 1,  // Normal
                    format: 'float32x3',
                    offset: 12,
                },
                {
                    shaderLocation: 2,  // Texture coordinates
                    format: 'float32x2',
                    offset: 24,
                },
                {
                    shaderLocation: 3,  // Tangent
                    format: 'float32x3',
                    offset: 32,
                },
            ],
        };
        this.pipeline = renderState.device.createRenderPipeline({
            label: 'UnlitPipeline',
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vertex',
                buffers: [
                    vertexLayout
                ]
            },
            fragment: {
                module: shaderModule,
                targets: [{ format: outputTextureFormat }]
            },
            depthStencil: {
                format: depthTextureFormat,
                depthWriteEnabled: true,
                depthCompare: 'less'
            }
        });

        
        this.skinnedPipeline = renderState.device.createRenderPipeline({
            label: 'UnlitSkinnedPipeline',
            layout: skinnedPipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexSkinned',
                buffers: [
                    vertexLayout,
                    {
                        arrayStride: 32,
                        attributes: [
                            { shaderLocation: 4, format: 'uint32x4', offset: 0 },
                            { shaderLocation: 5, format: 'float32x4', offset: 16 },
                        ]
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                targets: [{ format: outputTextureFormat }]
            },
            depthStencil: {
                format: depthTextureFormat,
                depthWriteEnabled: true,
                depthCompare: 'less'
            }
        });

        // Bind Groups

        const cameraComponent = camera.getComponent(Camera);
        if (!cameraComponent || !cameraComponent.cameraBuffer) {
            throw Error("Provided entity is not a valid camera!");
        }
        this.frameBindGroup = renderState.device.createBindGroup({
            layout: cameraBindGroupLayout,
            entries: [{
                binding: 0,
                resource: cameraComponent.cameraBuffer
            }]
        });

        for (const entity of scene.entities) {
            const transform = entity.getComponent(Transform);
            if (transform && transform.uniformBuffer) {
                const modelBuffer = transform.uniformBuffer;
                const modelBindGroup = renderState.device.createBindGroup({
                    layout: modelBindGroupLayout,
                    entries: [{
                        binding: 0,
                        resource: modelBuffer
                    }]
                });
                this.modelBindGroups.set(entity, modelBindGroup);
            }

            const mesh = entity.getComponent(Mesh);
            if (mesh) {
                const materialBuffer = mesh.material.uniformBuffer;
                if (!(mesh.material instanceof BasicMaterial)) {
                    continue;
                }

                const texture = renderState.getMaterialTexture(mesh.material.baseTexture);
                if (!texture) {
                    throw Error("Material texture not initialized!");
                }
                const materialBindGroup = renderState.device.createBindGroup({
                    layout: materialBindGroupLayout,
                    entries: [
                        { binding: 0, resource: materialBuffer! },
                        { binding: 1, resource: texture.view },
                        { binding: 2, resource: renderState.sampler }
                    ]
                });
                this.materialBindGroups.set(mesh.material, materialBindGroup);
            }

            const skin = entity.getComponent(Skin);
            if (skin) {
                this.skinBindGroups.set(entity, renderState.device.createBindGroup({
                    layout: skinBindGroupLayout,
                    entries: [{ binding: 0, resource: skin.jointMatricesBuffer! }]
                }));
            }
        }
    }

    render(pass: GPURenderPassEncoder, scene: Scene) {
        pass.setBindGroup(0, this.frameBindGroup);
        for (const entity of scene.entities) {
            const mesh = entity.getComponent(Mesh);
            if (!mesh) {
                continue;
            }

            const skin = entity.getComponent(Skin);
            if (!skin) {
                pass.setPipeline(this.pipeline);
            } else {
                pass.setPipeline(this.skinnedPipeline);
            }

            const modelBindGroup = this.modelBindGroups.get(entity);
            const materialBindGroup = this.materialBindGroups.get(mesh.material);
            const vertexBuffer = mesh.vertexBuffer;
            const indexBuffer = mesh.indexBuffer;

            if (!modelBindGroup || !materialBindGroup || !vertexBuffer || !indexBuffer) {
                continue;
            }

            pass.setBindGroup(1, modelBindGroup);
            pass.setBindGroup(2, materialBindGroup);
            if (skin) {
                const skinBindGroup = this.skinBindGroups.get(entity);
                if (skinBindGroup && mesh.skinVertexBuffer) {
                    pass.setBindGroup(3, this.skinBindGroups.get(entity));
                    pass.setVertexBuffer(1, mesh.skinVertexBuffer);
                }
            }
            pass.setVertexBuffer(0, vertexBuffer);
            if (mesh.indices instanceof Uint16Array) {
                pass.setIndexBuffer(indexBuffer, 'uint16');
            } else {
                pass.setIndexBuffer(indexBuffer, 'uint32');
            }
            pass.drawIndexed(mesh.indices.length);
        }
    }
}
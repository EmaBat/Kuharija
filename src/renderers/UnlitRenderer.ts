import { Camera } from "../components/Camera.ts";
import { Mesh } from "../components/Mesh.ts";
import { Transform } from "../components/Transform.ts";
import { ColorMaterial, type Material } from "../data/Material.ts";
import type { Entity } from "../Entity.ts";
import type { Scene } from "../Scene.ts";
import shaderCode from "../shaders/Unlit.wgsl?raw";


export class UnlitRenderer {
    pipeline: GPURenderPipeline;

    frameBindGroup: GPUBindGroup;
    modelBindGroups: Map<Entity, GPUBindGroup> = new Map();
    materialBindGroups: Map<Material, GPUBindGroup> = new Map();

    constructor(
        scene: Scene,
        camera: Entity,
        depthTextureFormat: GPUTextureFormat,
        outputTextureFormat: GPUTextureFormat,
        device: GPUDevice
    ) {
        // Bind Group Layouts

        const cameraBindGroupLayout = device.createBindGroupLayout({
            label: 'UnlitCameraLayout',
            entries: [{
                binding: 0,  // View + Projection matrix
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        const modelBindGroupLayout = device.createBindGroupLayout({
            label: 'UnlitModelLayout',
            entries: [{
                binding: 0, // Model matrix
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        const materialBindGroupLayout = device.createBindGroupLayout({
            label: 'UnlitMaterialLayout',
            entries: [
                {
                    binding: 0,  // Material uniforms
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                }
            ]
        });

        // Pipeline

        const pipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                cameraBindGroupLayout,
                modelBindGroupLayout,
                materialBindGroupLayout
            ]
        });

        const shaderModule = device.createShaderModule({
            label: 'UnlitShader',
            code: shaderCode
        });
        this.pipeline = device.createRenderPipeline({
            label: 'UnlitPipeline',
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                buffers: [{
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
                }]
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
        this.frameBindGroup = device.createBindGroup({
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
                const modelBindGroup = device.createBindGroup({
                    layout: modelBindGroupLayout,
                    entries: [{
                        binding: 0,
                        resource: modelBuffer
                    }]
                });
                this.modelBindGroups.set(entity, modelBindGroup);
            }

            const mesh = entity.getComponent(Mesh);
            if (mesh && mesh.material instanceof ColorMaterial) {
                const materialBuffer = mesh.material.uniformBuffer;
                if (materialBuffer) {
                    const materialBindGroup = device.createBindGroup({
                        layout: materialBindGroupLayout,
                        entries: [{
                            binding: 0,
                            resource: materialBuffer
                        }]
                    });
                    this.materialBindGroups.set(mesh.material, materialBindGroup);
                }
            }
        }
    }

    render(pass: GPURenderPassEncoder, scene: Scene) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.frameBindGroup);
        for (const entity of scene.entities) {
            const mesh = entity.getComponent(Mesh);
            if (!mesh) {
                continue;
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
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setIndexBuffer(indexBuffer, 'uint32');
            pass.drawIndexed(mesh.indices.length);
        }
    }
}
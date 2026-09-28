import { Camera } from "../components/CameraComponent.ts";
import { GlobalTransform } from "../components/GlobalTransformComponent.ts";
import { Model } from "../components/ModelComponent.ts";
import type { Entity } from "../data/Entity.ts";
import { BasicMaterial, ColorMaterial, type Material } from "../data/Material.ts";
import type { Scene } from "../data/Scene.ts";


export type MaterialConstructor<T extends Material = Material> = new (...args: any[]) => T;


export class BasicPipeline {
    pipeline: GPURenderPipeline | null = null;
    passDescriptor: GPURenderPassDescriptor | null = null;

    bindGroups: GPUBindGroup[] = [];

    async init(
        device: GPUDevice,
        targetTextureFormat: GPUTextureFormat,
        depthTextureFormat: GPUTextureFormat,
        scene: Scene
    ) {
        // We establish 3 bind groups, determined by the frequency
        // of change during the render pass. Camera bind group
        // is set once per frame - at the start of the pass,
        // while the model uniform changes at each model draw, etc.
        const cameraBindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });
        const modelBindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });
        const materialBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
            ]
        });
        
        // We set up bind groups in the pipeline layout. Because some native APIs
        // may perform some optimizations, we order the bind groups from
        // ones that change least to most frequently.
        const pipelineLayout = device.createPipelineLayout({
            label: 'BasicPipeline',
            bindGroupLayouts: [
                cameraBindGroupLayout,
                modelBindGroupLayout,
                materialBindGroupLayout
            ]
        });

        // We then construct the rendering pipeline
        const shaderCode = await fetch("shaders/ShaderBasic.wgsl").then((r) => r.text());
        const shaderModule = device.createShaderModule({
            label: 'BasicShader',
            code: shaderCode
        })
        
        this.pipeline = device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                buffers: [{
                    arrayStride: 44,
                    attributes: [
                        { format: 'float32x3', offset:  0, shaderLocation: 0 },  // Position
                        { format: 'float32x3', offset: 12, shaderLocation: 1 },  // Normal
                        { format: 'float32x2', offset: 24, shaderLocation: 2 },  // Texture Coordinates
                        { format: 'float32x3', offset: 32, shaderLocation: 3 },  // Tangent
                    ]
                }]
            },
            fragment: {
                module: shaderModule,
                targets: [{ format: targetTextureFormat }]
            },
            depthStencil: { format: depthTextureFormat }
        });

        for (const entity of scene.entities) {
            const models = entity.getComponentsByType(Model);
            const cameras = entity.getComponentsByType(Camera);
            const transform = entity.getComponentsByType(GlobalTransform);

            if (models.length > 0 || cameras.length > 0) {

            }
        }
    }

    render(
        scene: Scene,
        device: GPUDevice,
        targetTextureView: GPUTextureView,
        depthTextureView: GPUTextureView
    ) {
        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            label: 'BasicPipeline',
            colorAttachments: [{
                view: targetTextureView,
                storeOp: 'store',
                loadOp: 'clear',
                clearValue: [0.3, 0.4, 0.1, 1.0]
            }],
            depthStencilAttachment: {
                view: depthTextureView,
                depthStoreOp: 'discard',
                depthLoadOp: 'clear'
            }
        });
        renderPass.setPi
        
        for (const entity of scene.entities) {
            const 
        }
    }
}
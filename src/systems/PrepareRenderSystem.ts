import { Camera } from "../components/Camera.ts";
import { UnlitRenderer } from "../renderers/UnlitRenderer.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";


/* async function prepareUnlitPipeline(state: RenderState, scene: Scene) {
    // Bind Group Layouts

    const cameraBindGroupLayout = state.device.createBindGroupLayout({
        label: 'UnlitCameraLayout',
        entries: [{
            binding: 0,  // View + Projection matrix
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        }]
    });

    const modelBindGroupLayout = state.device.createBindGroupLayout({
        label: 'UnlitModelLayout',
        entries: [{
            binding: 0, // Model matrix
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        }]
    });

    const materialBindGroupLayout = state.device.createBindGroupLayout({
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

    const pipelineLayout = state.device.createPipelineLayout({
        bindGroupLayouts: [
            cameraBindGroupLayout,
            modelBindGroupLayout,
            materialBindGroupLayout
        ]
    });

    const depthTexture = state.getRenderTexture('sceneDepth');
    const depthTextureFormat = depthTexture.texture.format;
    
    const shaderCode = await fetch("shaders/Unlit.wgsl").then((r) => r.text());
    const shaderModule = state.device.createShaderModule({
        label: 'UnlitShader',
        code: shaderCode
    });
    const pipeline = state.device.createRenderPipeline({
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
            targets: [{ format: state.canvasFormat }]
        },
        depthStencil: {
            format: depthTextureFormat,
            depthWriteEnabled: true,
            depthCompare: 'less'
        }
    });

    // Bind Groups

    const cameraBindGroup = state.device.createBindGroup({
        layout: cameraBindGroupLayout,
        entries: [{
            binding: 0,
            resource: state.cameraBuffer
        }]
    });

    const modelBindGroups = new Map();
    const materialBindGroups = new Map();
    for (const entity of scene.entities) {
        const modelBuffer = state.getModelBuffer(entity);
        if (!modelBuffer) {
            continue;
        }
        const modelBindGroup = state.device.createBindGroup({
            layout: modelBindGroupLayout,
            entries: [{
                binding: 0,
                resource: modelBuffer
            }]
        });
        modelBindGroups.set(entity, modelBindGroup);

        const materialBuffer = state.getMaterialBuffer(entity);
        if (!materialBuffer) {
            continue;
        }
        const materialBindGroup = state.device.createBindGroup({
            layout: materialBindGroupLayout,
            entries: [{
                binding: 0,
                resource: materialBuffer
            }]
        });
        materialBindGroups.set(entity, materialBindGroup);
    }

    const pipelineData: PipelineData = {
        pipeline,
        cameraBindGroup,
        modelBindGroups,
        materialBindGroups
    };
    state.addPipeline('Unlit', pipelineData);
}
 */

export async function prepareRendering(state: RenderState, scene: Scene) {
    console.log("Preparing textures...");
    const sceneDepthTexture = state.createDepthTexture('sceneDepth');
    
    console.log("Preparing renderers...");
    
    // Unlit renderer
    const camera = scene.getEntitiesByComponent(Camera)[0];
    const unlitRenderer = new UnlitRenderer(
        scene,
        camera,
        sceneDepthTexture.format,
        state.canvasFormat,
        state.device
    );
    state.unlitRenderer = unlitRenderer;
}
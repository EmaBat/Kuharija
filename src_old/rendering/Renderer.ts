import type { Scene } from "../data/Scene.ts";

export class Renderer {
    // GPU objects
    device: GPUDevice;

    // Canvas
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // Textures
    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        const context = canvas.getContext('webgpu');
        if (!context) {
            throw Error('No WebGPU context');
        }

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        this.device = device;
        this.canvas = canvas;
        this.context = context;
        this.format = format;

        this.depthTexture = device.createTexture({
            label: 'DepthTexture',
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTextureView = this.depthTexture.createView();
    }

    render(scene: Scene) {
        const canvasTextureView = this.context.getCurrentTexture().createView();
        const commandEncoder = this.device.createCommandEncoder();
        
        const renderPass = commandEncoder.beginRenderPass({
            label: 'BasicPipeline',
            colorAttachments: [{
                view: canvasTextureView,
                storeOp: 'store',
                loadOp: 'clear',
                clearValue: [0.3, 0.4, 0.1, 1.0]
            }],
            depthStencilAttachment: {
                view: this.depthTextureView,
                depthStoreOp: 'discard',
                depthLoadOp: 'clear'
            }
        });
        renderPass.setPipeline();
    }
}
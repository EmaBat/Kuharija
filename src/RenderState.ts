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

    sceneDepthTexture: RenderTexture;

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

        // Init textures

        const sceneDepthTexture = this.device.createTexture({
            label: 'sceneDepthTexture',
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        const sceneDepthTextureview = sceneDepthTexture.createView();
        this.sceneDepthTexture = { texture: sceneDepthTexture, view: sceneDepthTextureview };
    }
}
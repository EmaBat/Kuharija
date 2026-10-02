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

    materialTextures: Map<ImageBitmap, RenderTexture> = new Map();
    sampler: GPUSampler;

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

        this.sampler = this.device.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat'
        });
    }

    createMaterialTexture(image: ImageBitmap) {
        const texture = this.device.createTexture({
            format: 'rgba8unorm',
            size: [image.width, image.height],
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
        });
        const view = texture.createView();
        this.materialTextures.set(image, { texture, view });
        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture },
            [image.width, image.height]
        );
    }

    getMaterialTexture(image: ImageBitmap) {
        return this.materialTextures.get(image);
    }

    updateRenderTextureSizes(width: number, height: number) {
        this.sceneDepthTexture.texture.destroy();

        this.sceneDepthTexture.texture = this.device.createTexture({
            label: 'sceneDepthTexture',
            format: 'depth24plus',
            size: [width, height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.sceneDepthTexture.view = this.sceneDepthTexture.texture.createView();

        this.canvas.width = width;
        this.canvas.height = height;

        this.context.configure({
            device: this.device,
            format: this.canvasFormat
        });
    }
}
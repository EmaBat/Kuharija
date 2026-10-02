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
}
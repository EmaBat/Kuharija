export interface Gpu {
  device: GPUDevice;
  context: GPUCanvasContext;
  canvas: HTMLCanvasElement;
  format: GPUTextureFormat;
}

export interface GpuResources {
  pipeline: GPURenderPipeline;
  depthTexture: GPUTexture;
  viewProjBuffer: GPUBuffer;
  viewProjBindGroup: GPUBindGroup;
}

export interface GpuObject {
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
}

export class ObjectCache {
    private cache = new WeakMap<object, GpuObject>();

    constructor(private device: GPUDevice, private layout: GPUBindGroupLayout) {}

    prepare(key: object) {
        const existing = this.cache.get(key);
        if (existing) {
            return existing;
        }

        const uniformBuffer = this.device.createBuffer({
            size: 64, // 4x4 matrika
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroup = this.device.createBindGroup({
            layout: this.layout,
            entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });

        const gpuObj = { uniformBuffer, bindGroup };
        this.cache.set(key, gpuObj);
        return gpuObj;
    } 
}
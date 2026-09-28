import { vec4 } from "gl-matrix";

export abstract class Material {
    uniformBuffer: GPUBuffer | null = null;

    /*protected bindGroup: GPUBindGroup | null = null;

    abstract prepareForRendering(device: GPUDevice): void;
     update(device: GPUDevice) {}
    getBindGroup() {
        if (!this.bindGroup) {
            throw Error("The bind group has not yet been initialized!");
        }
        return this.bindGroup;
    } */
}



export class ColorMaterial extends Material {
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);

    /* uniformBuffer: GPUBuffer | null = null;

    
    prepareForRendering(device: GPUDevice): void {
        // We get the pipeline required for this material.
        // PIPELINES is a singleton containing all pipelines.
        const pipeline = PIPELINES.getPipeline("UnlitPipeline");

        if (!this.uniformBuffer) {
            this.uniformBuffer = device.createBuffer({
                label: 'ColorMaterial',
                size: 16, // baseColor
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
            });
            device.queue.writeBuffer(this.uniformBuffer, 0, this.baseColor);
        }
        if (!this.bindGroup) {
            this.bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(2),
                entries: [{
                    binding: 0,
                    resource: this.uniformBuffer
                }]
            });
        }
    } */
}
import type { Entity } from "../Entity.ts";

export interface PipelineData {
    pipeline: GPURenderPipeline;
    cameraBindGroup: GPUBindGroup;
    modelBindGroups: Map<Entity, GPUBindGroup>;
    materialBindGroups: Map<Entity, GPUBindGroup>;
}
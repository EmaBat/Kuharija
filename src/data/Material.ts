import { vec4 } from "gl-matrix";

export abstract class Material {
    uniformBuffer: GPUBuffer | null = null;
}



export class ColorMaterial extends Material {
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);
}
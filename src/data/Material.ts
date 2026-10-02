import { vec4 } from "gl-matrix";

export abstract class Material {
    uniformBuffer: GPUBuffer | null = null;
}


export class BasicMaterial extends Material {
    baseTexture: ImageBitmap;
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);

    constructor(baseTexture: ImageBitmap, baseColor: vec4) {
        super();
        this.baseTexture = baseTexture;
        this.baseColor = baseColor;
    }
}
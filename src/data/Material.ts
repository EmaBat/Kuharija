import { vec4 } from "gl-matrix";

export abstract class Material {
    uniformBuffer: GPUBuffer | null = null;
}



export class ColorMaterial extends Material {
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);
}


export class BasicTextureMaterial extends Material {
    baseTexture: ImageBitmap;

    constructor(baseTexture: ImageBitmap) {
        super();
        this.baseTexture = baseTexture;
    }
}
import type { vec4 } from "gl-matrix";
import type { ImageTexture } from "./Texture.ts";


export interface Material {}


export class BasicMaterial implements Material {
    _baseColor: vec4;
    _baseTexture: ImageTexture;
    _baseSampler: GPUSampler;

    constructor(
        baseColor: vec4 = [0.0, 0.0, 0.0, 1.0],
        baseTexture: ImageTexture,
        baseSampler: GPUSampler
    ) {
        this._baseColor = baseColor;
        this._baseTexture = baseTexture;
        this._baseSampler = baseSampler;
    }
}


export class ColorMaterial implements Material {
    _baseColor: vec4;

    constructor(baseColor: vec4) {
        this._baseColor = baseColor;
    }
}
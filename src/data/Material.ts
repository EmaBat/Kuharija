import { vec4 } from "gl-matrix";
import { vec3 } from "gl-matrix";

/**
 * The structure that defines how mesh
 * surface is rendered.
 */
export abstract class Material {
    uniformBuffer: GPUBuffer | null = null;
}


/**
 * A simple example material that just applies
 * unshaded image texture to the mesh.
 */
export class BasicMaterial extends Material {
    baseTexture: ImageBitmap;
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);

    constructor(baseTexture: ImageBitmap, baseColor: vec4) {
        super();
        this.baseTexture = baseTexture;
        this.baseColor = baseColor;
    }
}


// osvetljen material
export class LitMaterial extends Material {
    baseTexture: ImageBitmap;
    baseColor: vec4 = vec4.fromValues(0, 0, 0, 1);

    // parametri odboja, ki so vezani na material

    // koliko svetlobe površina razprši 
    diffuse: number = 1.0;
    // kako močan je odsev - bolj plastične in kovinske površine imajo večjo številko
    specular: number = 0.0;
    // kako oster in velik je odsev - gladke površine imajo večje in močnejše odzeve
    shininess: number = 32;
    // koliko osnovne svetlobe (ambientne svetlobe) ostane v senci
    ambient: number = 0.5;
    // koliko barvne svetlobe oddaja predmet sam - recimo kristali ki "žarijo"
    emissive: vec3 = vec3.fromValues(0, 0, 0);

    constructor(baseTexture: ImageBitmap, baseColor: vec4) {
        super();
        this.baseColor = baseColor;
        this.baseTexture = baseTexture;
    }

}
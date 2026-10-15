import type { Component } from "../Component.ts";
import type { Material } from "../data/Material.ts";

export class Mesh implements Component {
    vertices: Float32Array;
    indices: Uint32Array | Uint16Array;
    material: Material;
    skinVertices: ArrayBuffer | null;

    vertexBuffer: GPUBuffer | null = null;
    skinVertexBuffer: GPUBuffer | null = null;
    indexBuffer: GPUBuffer | null = null;

    constructor(vertices: Float32Array, indices: Uint32Array | Uint16Array, material: Material, skinVertices: ArrayBuffer | null = null) {
        this.vertices = vertices;
        this.indices = indices;
        this.material = material;
        this.skinVertices = skinVertices;
    }
}
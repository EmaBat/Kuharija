import type { Mesh } from "../data/Mesh.ts";
import type { Component } from "./Component.ts";


/**
 * Stores information about meshes contained in this object.
 */
export class Model implements Component {
    _meshes: Mesh[];

    constructor() {
        this._meshes = [];
    }

    get meshes(): Mesh[] {
        return this._meshes;
    }

    addMesh(data: Mesh) {
        this._meshes.push(data);
    }
}
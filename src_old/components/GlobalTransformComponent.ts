import { mat4 } from "gl-matrix";
import type { Component } from "./Component.ts";


/**
 * Stores information about location/rotation/scale
 * in global coordinate system.
 * 
 * Computed in `transform` system.
 */
export class GlobalTransform implements Component {
    _globalMatrix: mat4;

    constructor() {
        this._globalMatrix = mat4.create();
    }

    get globalMatrix(): mat4 {
        return this._globalMatrix;
    }

    set globalMatrix(matrix: mat4) {
        this._globalMatrix = matrix;
    }
}
import { mat4 } from "gl-matrix";
import type { Component } from "../Component.ts";

export class Camera implements Component {
    private _aspect: number;
    private _fovy: number;
    private _near: number;
    private _far: number;

    private _perspectiveMatrix: mat4;
    private _isDirty: boolean;

    cameraBuffer: GPUBuffer | null = null;

    constructor(aspect: number, fovy: number, near: number, far: number) {
        this._aspect = aspect;
        this._fovy = fovy;
        this._near = near;
        this._far = far;

        this._perspectiveMatrix = mat4.create();
        this._isDirty = true;
    }

    set aspect(aspect: number) {
        this._aspect = aspect;
        this._isDirty = true;
    }

    get aspect() {
        return this._aspect;
    }

    set fovy(fovy: number) {
        this._fovy = fovy;
        this._isDirty = true;
    }

    get fovy() {
        return this._fovy;
    }

    set near(near: number) {
        this._near = near;
        this._isDirty = true;
    }

    get near() {
        return this._near;
    }

    set far(far: number) {
        this._far = far;
        this._isDirty = true;
    }

    get far() {
        return this._far;
    }

    get perspectiveProjection() {
        if (this._isDirty) {
            mat4.perspectiveZO(
                this._perspectiveMatrix,
                this._fovy,
                this._aspect,
                this._near,
                this._far
            )
        }
        return this._perspectiveMatrix;
    }
}
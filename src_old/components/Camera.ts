import { mat4 } from "gl-matrix";
import type { Component } from "./Component.ts";

export class Camera implements Component {
    _aspect: number;
    _fovy: number;
    _far: number;
    _near: number;

    _projection: mat4;
    _is_dirty: boolean;

    constructor(aspect: number, fovy: number, far: number, near: number) {
        this._aspect = aspect;
        this._fovy = fovy;
        this._far = far;
        this._near = near;
        this._projection = mat4.create();
        this._is_dirty = true;
    }

    set aspect(aspect: number) {
        this._is_dirty = true;
        this._aspect = aspect;
    }

    set fovy(fovy: number) {
        this._is_dirty = true;
        this._fovy = fovy;
    }

    set far(far: number) {
        this._is_dirty = true;
        this._far = far;
    }

    set near(near: number) {
        this._is_dirty = true;
        this._near = near;
    }

    get projection() {
        if (this._is_dirty) {
            mat4.perspectiveZO(this._projection, this._fovy, this._aspect, this._near, this._far);
            this._is_dirty = false;
        }
        return this._projection;
    }
}
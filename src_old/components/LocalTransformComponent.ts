import { vec3, mat4, quat } from "gl-matrix";
import type { Component } from "./Component.ts";

/**
 * Stores information about location/rotation/scale
 * in local coordinate system.
 */
export class LocalTransform implements Component {
    _location: vec3;
    _rotation: quat;
    _scale: vec3;

    _localMatrix: mat4;
    _isDirty: boolean;  // Tells us if _localMatrix should to be updated

    constructor(
        location: vec3 = vec3.create(),
        rotation: quat = quat.create(),
        scale: vec3 = vec3.create(),
    ) {
        this._location = location;
        this._rotation = rotation;
        this._scale = scale;

        this._localMatrix = mat4.create();
        this._isDirty = true;
    }

    get location(): vec3 {
        return this._location;
    }

    set location(location: vec3) {
        this._location = location;
        this._isDirty = true;
    }

    get rotation(): quat {
        return this._rotation;
    }

    set rotation(rotation: quat) {
        this._rotation = rotation;
        this._isDirty = true;
    }

    get scale(): vec3 {
        return this._scale;
    }

    set scale(scale: vec3) {
        this._scale = scale;
        this._isDirty = true;
    }

    get localMatrix(): mat4 {
        if (this._isDirty) {
            mat4.fromRotationTranslationScale(
                this._localMatrix,
                this._rotation,
                this._location,
                this._scale
            )
            this._isDirty = false;
        }
        return this._localMatrix;
    }
}
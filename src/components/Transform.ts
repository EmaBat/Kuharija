import { mat4, quat, vec3 } from "gl-matrix";
import type { Component } from "../Component.ts";

export enum TransformType {
    Free,
    LookAt
}

export class Transform implements Component {
    private _location: vec3;
    private _rotation: quat;
    private _scale: vec3;

    private _target: vec3;
    private _up: vec3;

    transformType: TransformType;

    private _localMatrix: mat4;
    private _worldMatrix: mat4;
    private _isDirty: boolean;

    uniformBuffer: GPUBuffer | null = null;

    constructor(transformType: TransformType) {
        this._location = vec3.fromValues(0, 0, 0);
        this._rotation = quat.fromValues(0, 0, 0, 1);
        this._scale = vec3.fromValues(1, 1, 1);

        this._target = vec3.fromValues(0, 0, 0);
        this._up = vec3.fromValues(0, 0, 1);

        this._localMatrix = mat4.create();
        this._worldMatrix = mat4.create();
        this._isDirty = true;
        this.transformType = transformType;
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

    get target(): vec3 {
        return this._target;
    }

    set target(target: vec3) {
        this._target = target;
        this._isDirty = true;
    }

    get up(): vec3 {
        return this._up;
    }

    set up(up: vec3) {
        this._up = up;
        this._isDirty = true;
    }

    get isDirty() {
        return this._isDirty;
    }

    get localMatrix(): mat4 {
        if (this._isDirty) {
            switch(this.transformType) {
                case TransformType.Free:
                    mat4.fromRotationTranslationScale(
                        this._localMatrix,
                        this._rotation,
                        this._location,
                        this._scale
                    )
                    break;
                
                case TransformType.LookAt:
                    mat4.lookAt(
                        this._localMatrix,
                        this._location,
                        this._target,
                        this._up
                    );
                    break;
            }
            this._isDirty = false;
        }
        return this._localMatrix;
    }

    get worldMatrix() {
        return this._worldMatrix;
    }

    get viewMatrix() {
        switch(this.transformType) {
            case TransformType.Free:
                return mat4.invert(mat4.create(), this._worldMatrix);
            case TransformType.LookAt:
                return this._worldMatrix;
        }
    }
}
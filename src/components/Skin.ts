import type { mat4 } from "gl-matrix";
import type { Component } from "../Component.ts";
import type { Entity } from "../Entity.ts";

export class Skin implements Component {
    joints: Entity[];
    inverseBindMatrices: mat4[];

    jointMatrices: Float32Array;
    jointMatricesBuffer: GPUBuffer | null = null;

    constructor(joints: Entity[], inverseBindMatrices: mat4[]) {
        this.joints = joints;
        this.inverseBindMatrices = inverseBindMatrices;
        this.jointMatrices = new Float32Array(joints.length * 16);
    }
}
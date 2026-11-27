import { vec3 } from "gl-matrix";
import type { Component } from "../Component.ts";

// največje število luči
export const MAX_LIGHTS = 8;

/**
 * Type of punctual light.
 */
export enum LightType {
    Point = 0, //kot sveča - iz ene točke na vse smeri
    Directional = 1, //kot sonce - iz ene oddaljene točke na celo sceno
    Spot = 2, //kot reflektor - iz ene točke v stožec
}
/**
 * A component representing punctual light:
 * point light, spot light, or directional light (sun).
 */
export class Light implements Component {
    private _color: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    private _intensity: number = 1.0;
    private _type: LightType;
    private _range: number = 0;  // distance of influence (for point and spot lights)

    private _innerConeAngle: number = 0;                // for spot light
    private _outerConeAngle: number = Math.PI / 4.0;    // for spot light

    enabled = false; // za omogočanje prižiga in ugašanja luči

    constructor(type: LightType) {
        this._type = type;
    }

    set color(color: vec3) {
        this._color = color;
    }

    get color() {
        return this._color;
    }

    set intensity(intensity: number) {
        this._intensity = intensity;
    }

    get intensity() {
        return this._intensity;
    }

    set range(range: number) {
        this._range = range;
    }

    get range() {
        return this._range;
    }

    set innerConeAngle(angle: number) {
        this._innerConeAngle = angle;
    }

    get innerConeAngle() {
        return this._innerConeAngle;
    }

    set outerConeAngle(angle: number) {
        this._outerConeAngle = angle;
    }

    get outerConeAngle() {
        return this._outerConeAngle;
    }

    get type() {
        return this._type;
    }
}
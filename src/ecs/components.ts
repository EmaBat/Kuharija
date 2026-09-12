import type { Entity } from "./entity.ts";
import { mat4, vec3, quat } from "gl-matrix";

// Tukaj definiramo vse komponente, ki jih entiteta lahko ima

// hrani starša
export class Parent {
    constructor(public entity: Entity) {}
}

// Pove ali hočemo uničiti to entiteto
export class Destroyed {}

// Lokalna transformacija
export class LocalTransform {
    position = vec3.create();
    rotation = quat.create();
    scale = vec3.fromValues(1, 1, 1);
}

// Globalna transformacija
export class WorldTransform {
    readonly matrix = mat4.create();
}

// Hrani id mesha v Mesh registru
export class MeshRenderer {
    constructor(public meshId: number) {}
}

// definira kamero - hrani parametre kamere
export class Camera {
    constructor(public fov = Math.PI / 3, public near = 0.1, public far = 100) {}
}

// pove katera je tista kamera s katero trenutno upodabljamo na zaslon
export class ActiveCamera {}

export class OrbitCamera {
    constructor (
        public target: Entity | null = null,
        public distance = 10,
        public yaw = 0,
        public pitch = 0.4,
    ) {}
}

// definira parametre simulacije vrtenja objektov
export class Spin {
    constructor(public axis = vec3.fromValues(0, 1, 0), public speed = 1) {}
}

// uporabnik lahko upravlja z entiteto, ki ima to komponento
export class ControlledByPlayer {}
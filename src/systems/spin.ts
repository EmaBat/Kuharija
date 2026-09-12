import { quat } from "gl-matrix";
import type { Scene } from "../ecs/scene.ts";
import { LocalTransform, Spin } from "../ecs/components.ts";

const tmp = quat.create();

// simulacija vrtenja objekta
export function spinSystem(scene: Scene, dt: number) {
    for (const e of scene.query(Spin, LocalTransform)) {
        const spin = e.requireComponent(Spin);
        const transform = e.requireComponent(LocalTransform);
        
        quat.setAxisAngle(tmp, spin.axis, spin.speed * dt);
        quat.multiply(transform.rotation, tmp, transform.rotation);
        quat.normalize(transform.rotation, transform.rotation);
    }
}
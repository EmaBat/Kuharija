import { mat4, vec3 } from "gl-matrix";
import { Destroyed, OrbitCamera, WorldTransform } from "../ecs/components.ts";
import type { Scene } from "../ecs/scene.ts";

export function cameraSystem(scene: Scene) {
    for (const e of scene.query(OrbitCamera, WorldTransform)) {
        const orbitCam = e.requireComponent(OrbitCamera);

        if (!orbitCam.target || orbitCam.target.has(Destroyed)) {
            continue;
        }

        const world = orbitCam.target.requireComponent(WorldTransform).matrix;
        // dobimo iz translacije
        const focus = vec3.fromValues(world[12], world[13], world[14]);

        orbitCam.pitch = Math.max(-1.4, Math.min(1.4, orbitCam.pitch));
        const eye = vec3.fromValues(
            focus[0] + orbitCam.distance * Math.cos(orbitCam.pitch) * Math.sin(orbitCam.yaw),
            focus[1] + orbitCam.distance * Math.sin(orbitCam.pitch),
            focus[2] + orbitCam.distance * Math.cos(orbitCam.pitch) * Math.cos(orbitCam.yaw),
        );

        // targetTo vrne matriko modela kamere v svetovnih koordinatah
        // primerno za shranjevanje v WorldTrasform
        mat4.targetTo(e.requireComponent(WorldTransform).matrix, eye, focus, [0, 1, 0]);
    }
}
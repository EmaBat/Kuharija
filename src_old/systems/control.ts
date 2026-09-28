import { OrbitCamera } from "../ecs/components.ts";
import { Scene } from "../ecs/scene.js";
import { Input } from "../input.js";

export function orbitInputSystem(scene: Scene, input: Input) {
    for (const e of scene.query(OrbitCamera)) {
        const orbitCam = e.requireComponent(OrbitCamera);
        orbitCam.yaw -= input.mouseDx * 0.005;
        orbitCam.pitch -= input.mouseDy * 0.005;
        orbitCam.distance = Math.max(2, Math.min(50, orbitCam.distance + input.wheel * 0.01));
    }
}
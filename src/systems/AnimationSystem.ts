import { quat, vec3 } from "gl-matrix";
import { Camera } from "../components/Camera.ts";
import { Transform } from "../components/Transform.ts";
import type { Scene } from "../Scene.ts";
import { Mesh } from "../components/Mesh.ts";
import { ProceduralAnimation } from "../components/Animation.ts";

export function animate(scene: Scene, dt: number) {
    const proceduralAnimatables = scene.getEntitiesByComponent(ProceduralAnimation);
    for (const animatable of proceduralAnimatables) {
        const animation = animatable.getComponent(ProceduralAnimation)!;
        animation.update(dt);
    }
}
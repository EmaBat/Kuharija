import type { Scene } from "../Scene.ts";
import { ProceduralAnimation } from "../components/Animation.ts";

export function animate(scene: Scene, dt: number) {
    const proceduralAnimatables = scene.getEntitiesByComponent(ProceduralAnimation);
    for (const animatable of proceduralAnimatables) {
        const animation = animatable.getComponent(ProceduralAnimation)!;
        animation.update(dt);
    }
}
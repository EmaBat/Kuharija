import type { Scene } from "../Scene.ts";
import { KeyframeAnimation } from "../components/KeyframeAnimation.ts";
import { ProceduralAnimation } from "../components/ProceduralAnimation.ts";

/**
 * A system that updates animated entities.
 * @param scene the collection of entities to update
 * @param dt the duration between previous and current frame (in seconds)
 */
export function animate(scene: Scene, dt: number) {
    const proceduralAnimatables = scene.getEntitiesByComponent(ProceduralAnimation);
    for (const animatable of proceduralAnimatables) {
        const animation = animatable.getComponent(ProceduralAnimation)!;
        animation.update(dt);
    }

    const keyframeAnimatables = scene.getEntitiesByComponent(KeyframeAnimation);
    for (const animatable of keyframeAnimatables) {
        const animation = animatable.getComponent(KeyframeAnimation)!;
        animation.update(dt);
    }
}
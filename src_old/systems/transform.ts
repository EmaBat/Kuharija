import { mat4 } from "gl-matrix";
import type { Entity } from "../ecs/entity.ts";
import type { Scene } from "../ecs/scene.ts";
import { LocalTransform, WorldTransform } from "../ecs/components.ts";

// Računa transformacije po drevesu navzdol 
// Transformacija starša vpliva tudi na otroka
export function transformSystem(scene:Scene): void {
    // posodobimo za vse korenske entitete 
    // (tiste, ki nimajo starša)
    for (const e of scene.roots()) {
        updateRecursively(scene, e, mat4.create());
    }
}

function updateRecursively(scene: Scene, e: Entity, parentWorld: mat4): void {
    const w = e.getComponent(WorldTransform);
    let world = parentWorld;
    
    if (w) {
        const l = e.getComponent(LocalTransform);
        if (l) {
            mat4.fromRotationTranslationScale(w.matrix, l.rotation, l.position, l.scale);
            mat4.multiply(w.matrix, parentWorld, w.matrix);
        } else {
            mat4.copy(w.matrix, parentWorld);
        }
        world = w.matrix;
    }

    // posodobimo za vsakega otroka 
    for (const c of scene.childrenOf(e)) {
        updateRecursively(scene, c, world);
    }
} 
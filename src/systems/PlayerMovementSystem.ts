import { vec3 } from "gl-matrix";
import type { Scene } from "../Scene.ts";
import type { Input } from "../Input.ts";
import { Transform } from "../components/Transform.ts";
import { PlayerController } from "../components/PlayerController.ts";

export function movePlayer(
    scene: Scene,
    input: Input,
    dt: number,
) {
    for (const entity of scene.getEntitiesByComponent(PlayerController)) {
        const controller = entity.getComponent(PlayerController)!;
        const transform = entity.getComponent(Transform);

        if (!transform) {
            continue;
        }

        let x = 0;
        let z = 0;

        if (input.isDown("KeyW") || input.isDown("ArrowUp")) z -= 1;
        if (input.isDown("KeyS") || input.isDown("ArrowDown")) z += 1;
        if (input.isDown("KeyA") || input.isDown("ArrowLeft")) x -= 1;
        if (input.isDown("KeyD") || input.isDown("ArrowRight")) x += 1;

        const direction = vec3.fromValues(x, 0, z);

        if (vec3.squaredLength(direction) === 0) {
            continue;
        }

        vec3.normalize(direction, direction);

        const nextPosition = vec3.clone(transform.location);

        vec3.scaleAndAdd(
            nextPosition,
            nextPosition,
            direction,
            controller.speed * dt,
        );

        transform.location = nextPosition;
    }
}
import { vec3 } from "gl-matrix";
import type { Scene } from "../Scene.ts";
import type { Input } from "../Input.ts";
import { Transform } from "../components/Transform.ts";
import { PlayerController } from "../components/PlayerController.ts";
import {
    collectObstacles,
    isBlocked,
} from "./CollisionSystem.ts";
//za spremninjanje smeri hoje glede na pogled kamere
import type { Entity } from "../Entity.ts";


export function movePlayer(
    scene: Scene,
    input: Input,
    dt: number,
    cameraEntity: Entity,
)   {

    const cameraTransform = cameraEntity.getComponent(Transform);

    if (!cameraTransform) {
        return;
    }

    // Smer od kamere proti njeni točki pogleda.
    const forward = vec3.create();

    vec3.subtract(
        forward,
        cameraTransform.target,
        cameraTransform.location,
    );

    // Hodimo samo po tleh.
    forward[1] = 0;

    if (vec3.squaredLength(forward) < 0.000001) {
        return;
    }

    vec3.normalize(forward, forward);

    // Desna smer = smer pogleda × smer navzgor.
    const right = vec3.create();

    vec3.cross(
        right,
        forward,
        vec3.fromValues(0, 1, 0),
    );

    vec3.normalize(right, right);



    for (const entity of scene.getEntitiesByComponent(PlayerController)) {
        const controller = entity.getComponent(PlayerController)!;
        const transform = entity.getComponent(Transform);

        if (!transform) {
            continue;
        }

        if (entity.parent) {
            throw new Error(
                "Objekt s PlayerController mora biti brez starša.",
            );
        }

        let x = 0;
        let z = 0;

        if (input.isDown("KeyW") || input.isDown("ArrowUp")) z -= 1;
        if (input.isDown("KeyS") || input.isDown("ArrowDown")) z += 1;
        if (input.isDown("KeyA") || input.isDown("ArrowLeft")) x -= 1;
        if (input.isDown("KeyD") || input.isDown("ArrowRight")) x += 1;

        const direction = vec3.create();

        vec3.scaleAndAdd(direction, direction, right, x);
        vec3.scaleAndAdd(direction, direction, forward, -z);

        if (vec3.squaredLength(direction) === 0) {
            continue;
        }

        vec3.normalize(direction, direction);

        if (vec3.squaredLength(direction) === 0) {
            continue;
        }

        vec3.normalize(direction, direction);

        // Poiščemo vse ovire s komponento Collider.
        const obstacles = collectObstacles(scene, entity);
        const nextPosition = vec3.clone(transform.location);

        const distance = controller.speed * dt;

        // Premik razdelimo na manjše korake.
        const maxStep = Math.min(
            0.1,
            controller.halfWidth,
            controller.halfDepth,
        );

        if (maxStep <= 0) {
            throw new Error("Velikost igralke mora biti pozitivna.");
        }

        const steps = Math.max(
            1,
            Math.ceil(Math.abs(distance) / maxStep),
        );

        const stepX = direction[0] * distance / steps;
        const stepZ = direction[2] * distance / steps;

        for (let i = 0; i < steps; i++) {
            // Premik po X dovolimo samo, če ni trka.
            const candidateX = nextPosition[0] + stepX;

            if (!isBlocked(
                candidateX,
                nextPosition[2],
                controller.halfWidth,
                controller.halfDepth,
                obstacles,
            )) {
                nextPosition[0] = candidateX;
            }

            // Ločeno preverimo še premik po Z.
            const candidateZ = nextPosition[2] + stepZ;

            if (!isBlocked(
                nextPosition[0],
                candidateZ,
                controller.halfWidth,
                controller.halfDepth,
                obstacles,
            )) {
                nextPosition[2] = candidateZ;
            }
        }

        transform.location = nextPosition;
    }
}
//kamera kis ledi naši čarovnici po prostoru

import { vec3 } from "gl-matrix";
import type { Entity } from "../Entity.ts";
import {
    Transform,
    TransformType,
} from "../components/Transform.ts";

export function followPlayer(
    cameraEntity: Entity,
    player: Entity,
) {
    const cameraTransform = cameraEntity.getComponent(Transform);
    const playerTransform = player.getComponent(Transform);

    if (!cameraTransform || !playerTransform) {
        return;
    }

    const position = playerTransform.location;

    cameraTransform.transformType = TransformType.LookAt;
    cameraTransform.up = vec3.fromValues(0, 1, 0);

    cameraTransform.location = vec3.fromValues(
        position[0],
        position[1] + 4,
        position[2] + 7,
    );

    cameraTransform.target = vec3.fromValues(
        position[0],
        position[1] + 1,
        position[2],
    );
}
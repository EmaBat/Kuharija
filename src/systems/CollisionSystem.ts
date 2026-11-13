//Ta datoteka poišče ovire in preverja prekrivanje


import { vec3 } from "gl-matrix";
import type { Entity } from "../Entity.ts";
import type { Scene } from "../Scene.ts";
import { Collider } from "../components/Collider.ts";
import { Transform } from "../components/Transform.ts";

export type ObstacleBounds = {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
};

export function collectObstacles(
    scene: Scene,
    ignoredEntity: Entity,
): ObstacleBounds[] {
    const obstacles: ObstacleBounds[] = [];

    for (const entity of scene.getEntitiesByComponent(Collider)) {
        if (entity === ignoredEntity) {
            continue;
        }

        const collider = entity.getComponent(Collider)!;
        const transform = entity.getComponent(Transform);

        if (!collider.enabled || !transform) {
            continue;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        const corner = vec3.create();

        // Pretvorimo vseh osem vogalov lokalnega kvadra.
        for (const x of [collider.min[0], collider.max[0]]) {
            for (const y of [collider.min[1], collider.max[1]]) {
                for (const z of [collider.min[2], collider.max[2]]) {
                    vec3.set(corner, x, y, z);

                    vec3.transformMat4(
                        corner,
                        corner,
                        transform.worldMatrix,
                    );

                    minX = Math.min(minX, corner[0]);
                    maxX = Math.max(maxX, corner[0]);
                    minZ = Math.min(minZ, corner[2]);
                    maxZ = Math.max(maxZ, corner[2]);
                }
            }
        }

        obstacles.push({ minX, maxX, minZ, maxZ });
    }

    return obstacles;
}

export function isBlocked(
    x: number,
    z: number,
    halfWidth: number,
    halfDepth: number,
    obstacles: ObstacleBounds[],
): boolean {
    return obstacles.some(obstacle =>
        x + halfWidth > obstacle.minX &&
        x - halfWidth < obstacle.maxX &&
        z + halfDepth > obstacle.minZ &&
        z - halfDepth < obstacle.maxZ
    );
}
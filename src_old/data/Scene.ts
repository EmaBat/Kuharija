import type { Entity } from "./Entity.ts";

export class Scene {
    entities: Entity[] = [];

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    removeEntity(entity: Entity) {
        let i = this.entities.indexOf(entity);
        this.entities.splice(i, 1);
    }
}
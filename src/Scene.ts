import type { Entity } from "./Entity.ts";
import type { ComponentConstructor } from "./Utils.ts";

export class Scene {
    entities: Entity[] = [];

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    removeEntity(entity: Entity) {
        let i = this.entities.indexOf(entity);
        this.entities.splice(i, 1);
    }

    getEntitiesByComponent(componentType: ComponentConstructor) {
        const entities = [];
        for (const entity of this.entities) {
            if (entity.getComponent(componentType)) {
                entities.push(entity);
            }
        }
        return entities;
    }
}
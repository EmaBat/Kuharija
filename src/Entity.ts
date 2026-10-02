import type { Component } from "./Component.ts";
import type { ComponentConstructor } from "./Utils.ts";

export class Entity {
    parent: Entity | null = null;
    name: string | null = null;
    private components = new Map<ComponentConstructor<any>, any>();

    addComponent<T extends Component>(component: T) {
        this.components.set(component.constructor as ComponentConstructor<T>, component);
    }

    getComponent<T extends Component>(componentType: ComponentConstructor<T>): T | undefined {
        return this.components.get(componentType);
    }

    removeComponent<T extends Component>(componentType: ComponentConstructor<T>) {
        this.components.delete(componentType);
    }

    setParent(parent: Entity) {
        this.parent = parent;
    }

    unparent() {
        this.parent = null;
    }
}
import type { Component } from "../components/Component.ts";


type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;


export class Entity {
    components: Component[] = [];
    children: Entity[] = [];

    addChild(entity: Entity) {
        this.children.push(entity);
    }

    getComponentsByType<T extends Component>(componentType: ComponentConstructor<T>): T[] {
        const results = [];
        for (const component of this.components) {
            if (component instanceof componentType) {
                results.push(component);
            }
        }
        return results;
    }

    addComponent(component: Component) {
        this.components.push(component);
    }

    // TODO
}
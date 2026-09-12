export type Ctor<T> = new (...args: any[]) => T;

export class Entity {
    readonly id: number;

    private components = new Map<Ctor<any>, any>();

    constructor(id: number) {
        this.id = id;
    }

    // doda novo komponento
    addComponent<T extends object>(c: T): T {
        this.components.set(c.constructor as Ctor<T>, c);
        return c;
    }

    // Ali entiteta ima določeno komponento?
    getComponent<T>(type: Ctor<T>): T | undefined {
        return this.components.get(type);
    }

    // Entiteta more imeti to komponento!
    requireComponent<T>(type: Ctor<T>): T {
        const c = this.components.get(type);
        if (!c) {
            console.error(`Entity ${this.id} is missing required component ${type.name}`);
            throw new Error(`Entity ${this.id} is missing required component ${type.name}`);
        }
        return c;
    }

    // odstrani komponento
    removeComponent<T>(type: Ctor<T>): void {
        this.components.delete(type);
    }

    // Ali ima vse iskane komponente?
    has(...types: Ctor<any>[]): boolean {
        return types.every(t => this.components.has(t));
    }

}
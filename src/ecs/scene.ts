import { Destroyed, Parent } from "./components.ts";
import { Entity, type Ctor } from "./entity.js";

export class Scene {
    private entities: Entity[] = [];
    private nextId = 0;

    create(): Entity {
        const e = new Entity(this.nextId++);
        this.entities.push(e);
        return e;
    }

    // Označi entiteto, ki jo želimo odstraniti + vse njene otroke.
    // Odstranijo se šele ob klicu flush() - le enkrat na frame.
    destroy(e: Entity): void {
        if (e.has(Destroyed)) return;
        e.addComponent(new Destroyed());
        for (const c of this.childrenOf(e)) this.destroy(c);
    }

    //Dejansko pobriše entitete
    flush(): void {
        this.entities = this.entities.filter(e => ! e.has(Destroyed));
    }

    setParent(child: Entity, parent?: Entity): void {
        // če parent ni definiran to pomeni da ga odstranimo
        if (!parent) {
            child.removeComponent(Parent);
            return;
        }

        for (let n: Entity | undefined = parent; n; n = n.getComponent(Parent)?.entity) {
            if (n === child) {
                console.error('Cycle in hierarchy');
                return;
            }
        }

        child.addComponent(new Parent(parent));
    } 

    childrenOf(parent: Entity): Entity[] {
        return this.entities.filter(e => 
            !e.has(Destroyed) && e.getComponent(Parent)?.entity === parent
        );
    }

    // vrne vse entitete iz scene, ki vsebujejo podane komponente
    query(...types: Ctor<any>[]): Entity[] {
        return this.entities.filter(e => 
            !e.has(Destroyed) && e.has(...types)
        );
    }

    roots(): Entity[] {
        return this.entities.filter(e => !e.has(Destroyed) && !e.has(Parent));
    }

}
import { vec4 } from "gl-matrix";
import type { Component } from "./Component.ts";
import { Mesh } from "./components/Mesh.ts";
import { Transform, TransformType } from "./components/Transform.ts";
import { BasicMaterial } from "./data/Material.ts";
import { Entity } from "./Entity.ts";



/**
 * This is an auxiliary type needed in some function inputs that require
 * passing component types, e.g. Scene.getEntitiesByComponent
 */
export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;


/**
 * Creates a cube entity.
 * @returns An entity with mesh and transform
 */
export function createCube(): Entity {
    const vertices = new Float32Array([
        -1, -1, -1,     0, 0, 0,    0, 0,   0, 0, 0,
        -1, -1,  1,     0, 0, 1,    0, 1,   0, 0, 0,
        -1,  1, -1,     0, 1, 0,    1, 0,   0, 0, 0,
        -1,  1,  1,     0, 1, 1,    1, 1,   0, 0, 0,
         1, -1, -1,     1, 0, 0,    0, 0,   0, 0, 0,
         1, -1,  1,     1, 0, 1,    0, 1,   0, 0, 0,
         1,  1, -1,     1, 1, 0,    1, 0,   0, 0, 0,
         1,  1,  1,     1, 1, 1,    1, 1,   0, 0, 0,
    ]);

    const indices = new Uint32Array([
        0, 1, 2,    2, 1, 3,
        4, 0, 6,    6, 0, 2,
        5, 4, 7,    7, 4, 6,
        1, 5, 3,    3, 5, 7,
        6, 2, 7,    7, 2, 3,
        1, 0, 5,    5, 0, 4,
    ]);
    
    const material = new BasicMaterial(new ImageBitmap(), vec4.fromValues(0.5, 1, 0, 1));

    const cube = new Entity();
    const mesh = new Mesh(vertices, indices, material);
    const transform = new Transform(TransformType.Free);
    cube.addComponent(mesh);
    cube.addComponent(transform);
    return cube;
}
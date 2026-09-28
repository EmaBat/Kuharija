import { mat4, quat, vec3, vec4 } from "gl-matrix";
import type { Component } from "./Component.ts";
import { Mesh } from "./components/Mesh.ts";
import { Transform, TransformType } from "./components/Transform.ts";
import { ColorMaterial } from "./data/Material.ts";
import { Entity } from "./Entity.ts";
import { Camera } from "./components/Camera.ts";
import { Scene } from "./Scene.ts";
import { ProceduralAnimation, ProceduralAnimationChannel } from "./components/ProceduralAnimation.ts";
import { KeyframeAnimation, KeyframeAnimationChannel, KeyframeInterpolation, KeyframeTarget, type Keyframe } from "./components/KeyframeAnimation.ts";

export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;


export function createCube() {
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

    const material = new ColorMaterial();
    material.baseColor = vec4.fromValues(0.5, 1, 0, 1);

    const cube = new Entity();
    const mesh = new Mesh(vertices, indices, material);
    const transform = new Transform(TransformType.Free);
    cube.addComponent(mesh);
    cube.addComponent(transform);
    return cube;
}

export function sampleScene() {
    
    // Objects 

    const cube = createCube();
    /* const animationChannel = new ProceduralAnimationChannel(
        (entity, dt, _passedTime) => {
            const transform = entity.getComponent(Transform);
            if (!transform) {
                return;
            }
            transform.rotation = quat.rotateX(transform.rotation, transform.rotation, dt);
            transform.rotation = quat.rotateY(transform.rotation, transform.rotation, dt);
        },
        10,
        true,
    );
    const animation = new ProceduralAnimation([animationChannel], cube);
    cube.addComponent(animation);
    animation.playAll(); */
    const keyframeChannel = new KeyframeAnimationChannel(
        KeyframeInterpolation.Linear,
        KeyframeTarget.Translation,
        [
            { time: 0.0, value: [0, 0, 0] },
            { time: 5.0, value: [1, 0, 0] },
            { time: 10.0, value: [-1, 0, 0] }
        ]
    );
    const keyframeChannel2 = new KeyframeAnimationChannel(
        KeyframeInterpolation.Linear,
        KeyframeTarget.Rotation,
        [
            { time: 0.0, value: [0, 0, 0, 1] },
            { time: 3.0, value: [ 0.5, 0.5, 0.5, 0.5 ] },
            { time: 6.0, value: [ 0, 0, 1, 0 ] },
        ]
    );
    const keyframeAnimation = new KeyframeAnimation([keyframeChannel, keyframeChannel2], true, false, cube);
    cube.addComponent(keyframeAnimation);
    
    // Camera

    const camera = new Entity();
    const cameraTransform = new Transform(TransformType.LookAt);
    cameraTransform.location = vec3.fromValues(0, 10, 0);
    const cameraCamera = new Camera(
        1,
        2 / Math.PI,
        0.1, 100.0
    );
    camera.addComponent(cameraTransform);
    camera.addComponent(cameraCamera);
    

    // Combine into scene

    const scene = new Scene();
    scene.addEntity(cube);
    scene.addEntity(camera);
    return scene;
}
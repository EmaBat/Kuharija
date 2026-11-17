import { RenderState } from "./RenderState.ts";
import { updateBuffers } from "./systems/BufferUpdateSystem.ts";
import { prepareRendering } from "./systems/PrepareRenderSystem.ts";
import { render } from "./systems/RenderSystem.ts";
import { computeTransforms } from "./systems/TransformSystem.ts";
import { animate as animateScene, playAnimation } from "./systems/AnimationSystem.ts";
import { createBuffers } from "./systems/BufferInitSystem.ts";
import { GLTFParser } from "./parsers/GLTFParser.ts";
import { Camera } from "./components/Camera.ts";
import { computeSkins } from "./systems/SkinningSystem.ts";
import { KeyframeAnimations } from "./components/KeyframeAnimation.ts";
import { Transform, TransformType } from "./components/Transform.ts";

//dodano za premikanje
import { Input } from "./Input.ts";
import { PlayerController } from "./components/PlayerController.ts";
import { movePlayer } from "./systems/PlayerMovementSystem.ts";

//dodano za kamero da sledi čarovcnici in lahko kroži okoli nje
import {
    followPlayer,
    OrbitCameraController,
} from "./systems/FollowCameraSystem.ts";


//dodano za trke
import { vec3, mat4} from "gl-matrix";
import { Collider } from "./components/Collider.ts";

//dodano za preverjanje ali obstajajo objekti ali ne
import type { Entity } from "./Entity.ts";


// ------ Create sample scene ------ //

const gltfParser = new GLTFParser();


//============ DEMO SCENE ============//

const gltfContent = await fetch("data/demo_scene.gltf").then((r) => r.text());
gltfParser.setJson(gltfContent, 'data/');

const scene = await gltfParser.parseScene(0);
if (!scene) {
    throw Error("Could not get GLTF scene!");
}
console.log(scene);
const icosphere = scene.getEntityByName('Icosphere');
if (icosphere) {
    playAnimation(scene, icosphere, 'IkosferaAkcija');
}
//po uspešnem nalaganju scene
//pošičemo kamero
const cameraEntity = scene.getEntityByName("Camera");

if (!cameraEntity) {
    throw new Error("V sceni ni objekta Camera.");
}

//IGRALEC
const player = scene.getEntityByName("Okostje");

if (!player) {
    throw new Error("V sceni ni objekta Okostje.");
}

player.addComponent(new PlayerController(3));

const input = new Input();

//KOCKA
//kocki dodamo veliksot oziroma komponento colilider ki se potem obdela v CollisionSystem
const cube = scene.getEntityByName("Cube");

if (!cube) {
    throw new Error("V sceni ni objekta Cube.");
}

cube.addComponent(new Collider(
    vec3.fromValues(-1, -1, -1),
    vec3.fromValues(1, 1, 1),
));

//izracun oddaljenosti igralca od kocke
//poskrbi tudi da se preveri ali entitete sploh obstajajo 
function requireTransform(entity: Entity): Transform {
    const transform = entity.getComponent(Transform);

    if (!transform) {
        throw new Error(
            `Objekt ${entity.name} nima komponente Transform.`,
        );
    }

    return transform;
}

const playerTransform = requireTransform(player);
const cubeTransform = requireTransform(cube);
const cameraTransform = requireTransform(cameraEntity);


/*
//==========Da se premika cilinder - tega še nočem ker ga hoče samo animirat da se premika
const cylinder = scene.getEntityByName('Okostje');
if (cylinder) {
    playAnimation(scene, cylinder, 'OkostjeAkcija')
}
*/



//============ LITTLE GUY ============//
/*
//const gltfContent = await fetch("data/little_guy.gltf").then((r) => r.text());
const gltfContent = await fetch("data/littleGuyEdit.gltf").then((r) => r.text());

gltfParser.setJson(gltfContent, 'data/');
const scene = await gltfParser.parseScene(0);
if (!scene) {
    throw Error("Could not get GLTF scene!");
}
console.log(scene);
const player = scene.getEntityByName('Okostje');
if (player) {
    playAnimation(scene, player, 'dance'); //ima tudi fight tako ločujemo katero animacijo naj predvajamo

}
    

*/
// ------ Initalize GPU/Rendering specific interfaces ------ //

if (!navigator.gpu) {
    throw Error("WebGPU not supported in this browser!");
}
const gpuAdapter = await navigator.gpu.requestAdapter();
if (!gpuAdapter) {
    throw Error("Could not get WebGPU adapter!");
}
const gpuDevice = await gpuAdapter.requestDevice();
gpuDevice.addEventListener('uncapturederror', (e) => console.error(e.error.message));
gpuDevice.lost.then((v) => {
    console.error(`GPU device lost: ${v.message} (${v.reason})`);
});

const canvas = document.querySelector('canvas');
if (!canvas) {
    throw Error("Could not find a canvas!");
}
//dodano da se kamera lahko premika okoli čarovnice
const orbitCamera = new OrbitCameraController(canvas);

const renderState = new RenderState(gpuDevice, canvas);


// ------ Create and write all buffers ------ //

createBuffers(renderState, scene);


// ------ Prepare pipelines ------ //

await prepareRendering(renderState, scene);

// ------ Events ------ //

function resize() {
    if (!canvas) {
        return;
    }
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    if (width === 0 || height === 0) {
        width = 1;
        height = 1;
    }

    let aspect = width / height;

    // Update the camera
    const cameraEntities = scene?.getEntitiesByComponent(Camera) ?? [];
    for (const cameraEntity of cameraEntities) {
        const camera = cameraEntity.getComponent(Camera)!;
        camera.aspect = aspect;
    }
    // Update the rendering textures
    renderState.updateRenderTextureSizes(width, height);
}

window.addEventListener('resize', (_) => resize());
resize();


// ------ Game states ------ //
enum GameMode {
    NORMAL,
    INTERACTION
}

let gameMode = GameMode.NORMAL;


// ------ Start game loop ------ //

let lastTime = performance.now();
function update(timestamp: number) {
    if (!scene) {
        return;
    }
/*
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
*/

//dodano za premikanje (omejiš velik preskok po daljši prekinitvi izrisovanja)
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    animateScene(scene, dt);
    computeTransforms(scene);

    if (cameraEntity && player && gameMode==GameMode.NORMAL) { //gameMode==GameMode.NORMAL ker ne zelimo da se igralec premika ce daje sestavine v kosarico
        // Nastavimo smer kamere glede na trenutno miško.
        followPlayer(cameraEntity, player, orbitCamera);

        // Premaknemo igralko glede na to smer.
        movePlayer(scene, input, dt, cameraEntity);
    }

    computeTransforms(scene);

    if (cameraEntity && player && gameMode==GameMode.NORMAL) { //gameMode==GameMode.NORMAL ker ne zelimo da se igralec premika ce daje sestavine v kosarico
        // Kamera sledi novemu položaju igralke.
        followPlayer(cameraEntity, player, orbitCamera);
    }

    //ce "Enter" preverimo ali je igralec dovol blizu kocke
    if(input.justPressed("Enter")){
    /*!!trenutno deluje ce se igralec pribliza "severne in juzne" strani kocke, to moramo se popraviti...odvisno od tega kaksna bo scena!!*/
        //dobimo lokacijo igralca in kocke in kamere
        const playerPosition = vec3.create();
        const cubePosition = vec3.create();


        mat4.getTranslation(playerPosition, playerTransform.worldMatrix);
        mat4.getTranslation(cubePosition, cubeTransform.worldMatrix);

    
        const dx = playerPosition[0] - cubePosition[0];
        const dy = playerPosition[1] - cubePosition[1];
    
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if(gameMode === GameMode.NORMAL){
            if(distance < 1.5){ //men se zdi 1.5 kr okej
                gameMode = GameMode.INTERACTION;
                console.log("Vstop v INTERACTION!");
                cameraTransform.transformType = TransformType.LookAt; //"kamero zelimo usmeriti proti doloceni tocki"
                //                                                  kamera:       gor/dol             blizu/dalec
                cameraTransform.location = vec3.fromValues(cubePosition[0], cubePosition[1] +0.5 , cubePosition[2] + 5); //doloci kje se kamera nahaj
                cameraTransform.target = vec3.clone(cubePosition); //doloci kam naj kamera glede
            }else{
                console.log("predalec od kocke!");
            }
        }else{
            gameMode = GameMode.NORMAL;
            console.log("vrnitev v NORMAL!");
        }
    }


    computeTransforms(scene);
    computeSkins(scene);
    updateBuffers(renderState, scene);
    //izrisi
    render(renderState, scene);

    //pobrisi
    input.endFrame();
    requestAnimationFrame(update);

    /*
    animateScene(scene, dt);
    //dodano za premikanje igralca
    movePlayer(scene, input, dt);
    //sledenje čarovnici
    if (cameraEntity && player) {
        followPlayer(cameraEntity, player);
    }
    //followPlayer(cameraEntity, player);

    computeTransforms(scene);
    computeSkins(scene);
    updateBuffers(renderState, scene);
    render(renderState, scene);

    requestAnimationFrame(update);
    */
}

requestAnimationFrame(update);
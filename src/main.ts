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


//dodano za premikanje
import { Input } from "./Input.ts";
import { PlayerController } from "./components/PlayerController.ts";
import { movePlayer } from "./systems/PlayerMovementSystem.ts";

//dodano za kamero da sledi čarovcnici
import { followPlayer } from "./systems/FollowCameraSystem.ts";

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

const player = scene.getEntityByName("Okostje");

if (!player) {
    throw new Error("V sceni ni objekta Okostje.");
}

player.addComponent(new PlayerController(3));

const input = new Input();





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
}

requestAnimationFrame(update);
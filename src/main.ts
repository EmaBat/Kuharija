import { RenderState } from "./RenderState.ts";
import { updateBuffers, writeCameraBuffer, writeMaterialBuffer, writeMeshBuffers, writeTransformBuffer } from "./systems/BufferUpdateSystem.ts";
import { prepareRendering } from "./systems/PrepareRenderSystem.ts";
import { render } from "./systems/RenderSystem.ts";
import { computeTransforms } from "./systems/TransformSystem.ts";
import { sampleScene } from "./Utils.ts";
import { animate } from "./systems/AnimationSystem.ts";
import { createBuffers } from "./systems/BufferInitSystem.ts";
import { GLTFParser } from "./parsers/GLTFParser.ts";


// ------ Create sample scene ------ //

//const scene = sampleScene();
const gltfParser = new GLTFParser();
let gltfContent = await fetch("data/demo_scene.gltf").then((r) => r.text());
gltfParser.setJson(gltfContent, 'data/');
const scene = await gltfParser.parseScene(0);
if (!scene) {
    throw Error("Could not get GLTF scene!");
}

// ------ Initalize GPU specific stuff ------ //

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw Error("Could not get WebGPU adapter!");
}
const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
if (!canvas) {
    throw Error("Could not find a canvas!");
}
const renderState = new RenderState(device, canvas);


// ------ Create and write all buffers ------ //

createBuffers(renderState, scene);


// ------ Prepare pipelines ------ //

await prepareRendering(renderState, scene);


// ------ Start render loop ------ //


let lastTime = performance.now();
function update(timestamp: number) {
    if (!scene) {
        return;
    }

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    animate(scene, dt);
    computeTransforms(scene);
    updateBuffers(renderState, scene);
    render(renderState, scene);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);
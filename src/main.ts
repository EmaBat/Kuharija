import { RenderState } from "./RenderState.ts";
import { updateBuffers, writeCameraBuffer, writeMaterialBuffer, writeMeshBuffers, writeTransformBuffer } from "./systems/BufferUpdateSystem.ts";
import { prepareRendering } from "./systems/PrepareRenderSystem.ts";
import { render } from "./systems/RenderSystem.ts";
import { computeTransforms } from "./systems/TransformSystem.ts";
import { sampleScene } from "./Utils.ts";
import { animate } from "./systems/AnimationSystem.ts";
import { createBuffers } from "./systems/BufferInitSystem.ts";


// ------ Create sample scene ------ //

const scene = sampleScene();

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

// TODO: This is bad, move to createBuffers
for (const entity of scene.entities) {
    writeMeshBuffers(renderState, entity);
    writeMaterialBuffer(renderState, entity);
    writeCameraBuffer(renderState, entity);
    writeTransformBuffer(renderState, entity);
}


// ------ Prepare pipelines ------ //

await prepareRendering(renderState, scene);


// ------ Start render loop ------ //


let lastTime = performance.now();
function update(timestamp: number) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    animate(scene, dt);
    computeTransforms(scene);
    updateBuffers(renderState, scene);
    render(renderState, scene);

    requestAnimationFrame(update);
}

requestAnimationFrame(update);
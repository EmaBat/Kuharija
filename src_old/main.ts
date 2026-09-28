import { Renderer } from "./rendering/Renderer.ts";


// -------------- Init -------------- //


const canvas = document.querySelector('canvas');
if (!canvas) {
    throw Error("No canvas element defined");
}

if (!navigator.gpu) {
    throw Error("WebGPU is not supported in current browser");
}
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw Error("No suitable WebGPU adapter found");
}
const device = await adapter.requestDevice();

const renderer = new Renderer(device, canvas);

// TODO: Init state data


// TODO: Load scene


// TODO: Configure GPU for rendering


// -------------- Loop -------------- //


let lastTime = performance.now();
function update(timestamp: number) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // TODO

    requestAnimationFrame(update);
}
requestAnimationFrame(update);
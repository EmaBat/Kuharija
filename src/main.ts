import { vec3 } from "gl-matrix";
import { MeshRegistry } from "./gpu/meshRegistry.ts";
import { ObjectCache, type Gpu, type GpuResources } from "./gpu/gpuObject.ts";
import { Scene } from "./ecs/scene.ts";
import { ActiveCamera, Camera, ControlledByPlayer, LocalTransform, MeshRenderer, OrbitCamera, Spin, WorldTransform } from "./ecs/components.ts";
import { spinSystem } from "./systems/spin.ts";
import { transformSystem } from "./systems/transform.ts";
import { cameraSystem } from "./systems/camera.ts";
import { renderSystem } from "./systems/renderer.ts";
import { Input } from "./input.ts";
import { orbitInputSystem } from "./systems/control.ts";

async function initGPU(): Promise<Gpu | undefined> {
    if (!navigator.gpu) {
        console.error('WebGPU is not supported in current browser');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.error('No suitable adapter found');
        return;
    }

    const device = await adapter.requestDevice();

    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('No canvas element defined');
        return;
    }

    const context = canvas.getContext('webgpu');
    if (!context) {
        console.error('No WebGPU context');
        return;
    }
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    return { 
        device,
        context,
        canvas,
        format
    }
}

const vertices = new Float32Array([
    // pozicija       // barva
    -1, -1, -1,  1,   0, 0, 0, 1,
    -1, -1,  1,  1,   0, 0, 1, 1,
    -1,  1, -1,  1,   0, 1, 0, 1,
    -1,  1,  1,  1,   0, 1, 1, 1,
     1, -1, -1,  1,   1, 0, 0, 1,
     1, -1,  1,  1,   1, 0, 1, 1,
     1,  1, -1,  1,   1, 1, 0, 1,
     1,  1,  1,  1,   1, 1, 1, 1,
]);

const indices = new Uint32Array([
    0, 1, 2,    2, 1, 3,
    4, 0, 6,    6, 0, 2,
    5, 4, 7,    7, 4, 6,
    1, 5, 3,    3, 5, 7,
    6, 2, 7,    7, 2, 3,
    1, 0, 5,    5, 0, 4,
]);

async function createResources(gpu: Gpu): Promise<GpuResources | undefined> {
    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride:32,
        attributes: [
            {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
            },
            {
                shaderLocation: 1,
                offset: 16,
                format: 'float32x4',
            },
        ],
    };

    const code = await fetch('shader.wgsl').then(response => response.text());
    const module = gpu.device.createShaderModule({ code });
    const pipeline = gpu.device.createRenderPipeline({
        vertex: {
            module,
            buffers: [ vertexBufferLayout ]
        },
        fragment: {
            module,
            targets: [{ format: gpu.format }],
        },
        depthStencil: {
            format: 'depth24plus',
            depthWriteEnabled: true,
            depthCompare:'less',
        },
        layout: 'auto'
    });

    const viewProjBuffer = gpu.device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    const viewProjBindGroup = gpu.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: viewProjBuffer },
            }
        ]
    });

    let depthTexture = gpu.device.createTexture({
        format: 'depth24plus',
        size: [gpu.canvas.width, gpu.canvas.height],
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    return { pipeline, depthTexture, viewProjBuffer, viewProjBindGroup };
}

async function init() {
    const gpu = await initGPU();
    if (!gpu) {
        console.error('GPU is not initialized.');
        return;
    }
    const resources = await createResources(gpu);
    if (!resources) {
        console.error('Resources are not created.');
        return;
    }
    return { gpu, resources };
}

const initRes = await init();
if (!initRes) {
    throw new Error('Init failed!');
}
const { gpu, resources } = initRes;

const meshes = new MeshRegistry(gpu.device);
const cube = meshes.create(vertices, indices);

const objectCache = new ObjectCache(gpu.device, resources.pipeline.getBindGroupLayout(1));

const scene = new Scene();

const parentCube = scene.create();
parentCube.addComponent(new LocalTransform());
parentCube.addComponent(new WorldTransform());
parentCube.addComponent(new MeshRenderer(cube));
parentCube.addComponent(new Spin(vec3.fromValues(1, 0, 1), 1.0));

const childCube = scene.create();
const transform = childCube.addComponent(new LocalTransform());
vec3.set(transform.position, 3, 0, 0);
vec3.set(transform.scale, 0.5, 0.5, 0.5);
childCube.addComponent(new WorldTransform());
childCube.addComponent(new MeshRenderer(cube));
childCube.addComponent(new Spin(vec3.fromValues(1, 1, 0), 4.0));
scene.setParent(childCube, parentCube);


const camera = scene.create();
camera.addComponent(new Camera(Math.PI / 3, 0.1, 100));
camera.addComponent(new ActiveCamera());
camera.addComponent(new OrbitCamera(parentCube, 10, 0, 0));
camera.addComponent(new WorldTransform());
camera.addComponent(new ControlledByPlayer());

const input = new Input();
input.attach(gpu.canvas);

let lastTime = performance.now();
function frame(timestemp: number) {
    const dt = Math.min((timestemp - lastTime) / 1000, 0.1);
    lastTime = timestemp;

    orbitInputSystem(scene, input);
    spinSystem(scene, dt);
    transformSystem(scene);
    cameraSystem(scene);
    renderSystem(scene, gpu, resources, objectCache, meshes);

    scene.flush();
    input.endFrame();

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
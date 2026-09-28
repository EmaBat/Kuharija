import { mat4 } from "gl-matrix";
import { ActiveCamera, Camera, MeshRenderer, WorldTransform } from "../ecs/components.ts";
import type { Scene } from "../ecs/scene.ts";
import type { Gpu, GpuResources, ObjectCache } from "../gpu/gpuObject.ts";
import { MeshRegistry } from "../gpu/meshRegistry.js";

export function renderSystem(scene: Scene, gpu: Gpu, resources: GpuResources, objCache: ObjectCache, meshRegistry: MeshRegistry) {
    const cams = scene.query(Camera, WorldTransform, ActiveCamera);
    if (cams.length === 0) {
        console.error('Scene does not have any Camera object');
        return;
    };

    // pridobimo kamero iz katere rišemo na zaslon
    // in izračunamo njeno projekcijsko in matriko pogleda
    const cam = cams[0];

    const viewMatrix = mat4.create();
    mat4.invert(viewMatrix, cam.requireComponent(WorldTransform).matrix);

    const c = cam.requireComponent(Camera);
    const projMatrix = mat4.create();
    // uporabljamo perspectiveZO, saj ta preslika globino od 0 do 1
    mat4.perspectiveZO(projMatrix, c.fov, gpu.canvas.width / gpu.canvas.height, c.near, c.far);

    const viewProj = mat4.create();
    mat4.multiply(viewProj, projMatrix, viewMatrix);

    gpu.device.queue.writeBuffer(resources.viewProjBuffer, 0, viewProj);

    // pridobimo vse objekte, ki jih v sceni moramo izrisati
    const drawables = scene.query(WorldTransform, MeshRenderer);

    const encoder = gpu.device.createCommandEncoder();
    const renderPass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: gpu.context.getCurrentTexture().createView(),
                clearValue: [1, 1, 1, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }
        ],
        depthStencilAttachment: {
            view: resources.depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'discard',
        } 
    });
    renderPass.setPipeline(resources.pipeline);
    renderPass.setBindGroup(0, resources.viewProjBindGroup);

    // narišemo vsak od objektov
    for (const e of drawables) {
        const obj = objCache.prepare(e);
        gpu.device.queue.writeBuffer(obj.uniformBuffer, 0, e.requireComponent(WorldTransform).matrix);
        renderPass.setBindGroup(1, obj.bindGroup);

        const mesh = meshRegistry.get(e.requireComponent(MeshRenderer).meshId);
        renderPass.setVertexBuffer(0, mesh.vertexBuffer);
        renderPass.setIndexBuffer(mesh.indexBuffer, 'uint32');
        renderPass.drawIndexed(mesh.indexCount);
    }

    renderPass.end();
    gpu.device.queue.submit([encoder.finish()]);
}


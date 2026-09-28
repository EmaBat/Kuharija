import { Camera } from "../components/Camera.ts";
import { Transform } from "../components/Transform.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";
import { Mesh } from "../components/Mesh.ts";
import type { Entity } from "../Entity.ts";
import { ColorMaterial } from "../data/Material.ts";

export function writeCameraBuffer(state: RenderState, entity: Entity) {
    const camera = entity.getComponent(Camera);
    const transform = entity.getComponent(Transform);

    if (!camera) {
        return;
    }
    if (!transform) {
        console.warn("Error while writing buffers: Active camera does not have a transform! Ignoring...");
        return;
    }
    const viewMatrix = transform.viewMatrix;

    if (camera.cameraBuffer) {
        state.device.queue.writeBuffer(camera.cameraBuffer, 0, viewMatrix);
        state.device.queue.writeBuffer(camera.cameraBuffer, 64, camera.perspectiveProjection);
    } else {
        console.warn("Camera buffer was not initialized! Ignoring...");
    }
}

export function writeTransformBuffer(state: RenderState, entity: Entity) {
    const transform = entity.getComponent(Transform);
    if (!transform) {
        return;
    }

    if (transform.uniformBuffer) {
        state.device.queue.writeBuffer(transform.uniformBuffer, 0, transform.worldMatrix);
    } else {
        console.warn("Transform buffer was not initialized! Ignoring...");
    }
}

export function writeMeshBuffers(state: RenderState, entity: Entity) {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) {
        return;
    }

    if (mesh.vertexBuffer) {
        state.device.queue.writeBuffer(mesh.vertexBuffer, 0, mesh.vertices);
    } else {
        console.warn("Vertex buffer not initialized!");
    }

    if (mesh.indexBuffer) {
        state.device.queue.writeBuffer(mesh.indexBuffer, 0, mesh.indices);
    } else {
        console.warn("Index buffer not initialized!");
    }
}

export function writeMaterialBuffer(state: RenderState, entity: Entity) {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) {
        return;
    }

    const material = mesh.material;
    if (!material.uniformBuffer) {
        console.warn("Material buffer not initialized!");
        return;
    }

    if (material instanceof ColorMaterial) {
        state.device.queue.writeBuffer(material.uniformBuffer, 0, material.baseColor);
    }
}

export function updateBuffers(state: RenderState, scene: Scene) {
    // We only update buffers that likely change every frame
    for (const entity of scene.entities) {
        writeCameraBuffer(state, entity);
        writeTransformBuffer(state, entity);
    }
}
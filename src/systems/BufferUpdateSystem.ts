import { Camera } from "../components/Camera.ts";
import { Transform } from "../components/Transform.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";
import { Mesh } from "../components/Mesh.ts";
import type { Entity } from "../Entity.ts";
import { BasicMaterial, LitMaterial } from "../data/Material.ts";
import { Skin } from "../components/Skin.ts";

//za luči
import { Light, LightType, MAX_LIGHTS } from "../components/Light.ts";
import { vec3, vec4, mat4 } from "gl-matrix";

export function _writeCameraBuffer(state: RenderState, entity: Entity) {
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
        state.device.queue.writeBuffer(camera.cameraBuffer, 128, transform.location);
    } else {
        console.warn("Camera buffer was not initialized! Ignoring...");
    }
}

export function _writeTransformBuffer(state: RenderState, entity: Entity) {
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

export function _writeMeshBuffers(state: RenderState, entity: Entity) {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) {
        return;
    }

    for (const primitives of mesh.primitives.values()) {
        for (const primitive of primitives) {
            if (primitive.vertexBuffer) {
                state.device.queue.writeBuffer(primitive.vertexBuffer, 0, primitive.vertices);
            } else {
                console.warn("Vertex buffer not initialized!");
            }
        
            if (primitive.indexBuffer) {
                state.device.queue.writeBuffer(primitive.indexBuffer, 0, primitive.indices);
            } else {
                console.warn("Index buffer not initialized!");
            }
        
            if (primitive.skinVertexBuffer) {
                state.device.queue.writeBuffer(primitive.skinVertexBuffer, 0, primitive.skinVertices);
            }
        }
    }

}

export function _writeSkinBuffer(state: RenderState, entity: Entity) {
    const skin = entity.getComponent(Skin);
    if (!skin) {
        return;
    }

    if (skin.jointMatricesBuffer) {
        state.device.queue.writeBuffer(skin.jointMatricesBuffer, 0, skin.jointMatrices);
    } else {
        console.warn("Joint matrix buffer not initialized!");
    }
}

export function _writeMaterialBuffer(state: RenderState, entity: Entity) {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) {
        return;
    }

    const unlit_primitives = mesh.getPrimitivesByMaterial(BasicMaterial) ?? [];
    for (const primitive of unlit_primitives) {
        const material = primitive.material as BasicMaterial;
        if (!material.uniformBuffer) {
            console.warn("Material buffer not initialized!");
            continue;
        }

        state.device.queue.writeBuffer(material.uniformBuffer, 0, material.baseColor);
    }

    const lit_primitives = mesh.getPrimitivesByMaterial(LitMaterial) ?? [];
    for (const primitive of lit_primitives) {
        const material = primitive.material as LitMaterial;
        if (!material.uniformBuffer) {
            console.warn("Material buffer not initialized!");
            continue;
        }

        const data = new Float32Array(12);
        data.set(material.baseColor, 0);
        const params = [material.diffuse, material.specular, material.shininess, material.ambient];
        data.set(params, 4);
        data.set(material.emissive, 8);

        state.device.queue.writeBuffer(material.uniformBuffer, 0, data);
    }

}

// buffer za luči
export function _writeLightBuffer(state: RenderState, scene: Scene) {
    if(!state.lightBuffer) return;

    const lights = scene.getEntitiesByComponent(Light);
    
    let count = 0;
    const data = new Float32Array(4 + MAX_LIGHTS * 16);
    for(const entity of lights) {
        const light = entity.getComponent(Light);
        if(!light) continue;
        const transform = entity.getComponent(Transform);
        if (!transform) continue;

        const position = mat4.getTranslation(vec3.create(), transform.worldMatrix);
        const dir4 = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, -1, 0), transform.worldMatrix);
        const dir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);
        vec3.normalize(dir, dir);

        const offset = 4 + count * 16;
        // pozicija, tip - tipe zapišemo s številom kot si sledijo po vrsti v enum LightType (Directional - 1)
        data.set([position[0], position[1], position[2], light.type], offset);
        data.set([dir[0], dir[1], dir[2], light.range], offset + 4);
        data.set([light.color[0], light.color[1], light.color[2], light.intensity], offset + 8);
        data.set([Math.cos(light.innerConeAngle), Math.cos(light.outerConeAngle)], offset + 12);
        
        count++;
        if (count >= MAX_LIGHTS) break;
    }
    data[0] = count;

    state.device.queue.writeBuffer(state.lightBuffer, 0, data);
}

/**
 * The system that writes the data to the GPU buffers of the scene.
 * Only camera buffers, transform buffers, and skin buffers are
 * written by default.
 * @param state the render state
 * @param scene the current scene
 */
export function updateBuffers(state: RenderState, scene: Scene) {
    // We only update buffers that likely change every frame.
    // Change if your buffer update requirements are different.
    for (const entity of scene.entities) {
        _writeCameraBuffer(state, entity);
        _writeTransformBuffer(state, entity);
        _writeSkinBuffer(state, entity);
    }
    _writeLightBuffer(state, scene); //kličemo za celo sceno
}
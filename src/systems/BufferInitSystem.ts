import { mat4 } from "gl-matrix";
import { Camera } from "../components/Camera.ts";
import { Transform } from "../components/Transform.ts";
import type { Entity } from "../Entity.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";
import { Mesh } from "../components/Mesh.ts";
import { BasicMaterial, Material } from "../data/Material.ts";
import { writeCameraBuffer, writeMaterialBuffer, writeMeshBuffers, writeSkinBuffer, writeTransformBuffer } from "./BufferUpdateSystem.ts";
import { Skin } from "../components/Skin.ts";

function createCameraBuffers(state: RenderState, cameraEntity: Entity) {
    const camera = cameraEntity.getComponent(Camera);
    if (!camera) {
        return;
    }

    let projectionViewMatricesSize = 2 * 16 * 4;
    camera.cameraBuffer = state.device.createBuffer({
        size: projectionViewMatricesSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
    });
}

function createSkinBuffer(state: RenderState, entity: Entity) {
    const skin = entity.getComponent(Skin);
    if (!skin) {
        return;
    }

    let jointMatrixSize = 16 * 4 * skin.joints.length;
    skin.jointMatricesBuffer = state.device.createBuffer({
        size: jointMatrixSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    });
}

function createTransformBuffers(state: RenderState, entity: Entity) {
    const transform = entity.getComponent(Transform);
    if (!transform) {
        return;
    }

    let transformMatrixSize = 16 * 4;
    transform.uniformBuffer = state.device.createBuffer({
        size: transformMatrixSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
    });
}

function createMeshBuffer(state: RenderState, entity: Entity) {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) {
        return;
    }

    mesh.vertexBuffer = state.device.createBuffer({
        size: mesh.vertices.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    });
    mesh.indexBuffer = state.device.createBuffer({
        size: mesh.indices.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.INDEX
    });

    if (mesh.skinVertices) {
        let skinVertexBufferSize = mesh.skinVertices.byteLength;
        mesh.skinVertexBuffer = state.device.createBuffer({
            size: skinVertexBufferSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
        });
    }

    let material = mesh.material;
    createMateralBuffer(state, material);
}

function createMateralBuffer(state: RenderState, material: Material) {
    if (material instanceof BasicMaterial) {
        material.uniformBuffer = state.device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
        });
    }
}

export function createBuffers(state: RenderState, scene: Scene) {
    for (const entity of scene.entities) {
        createCameraBuffers(state, entity);
        createTransformBuffers(state, entity);
        createMeshBuffer(state, entity);
        createSkinBuffer(state, entity);
    }

    for (const entity of scene.entities) {
        writeMeshBuffers(state, entity);
        writeMaterialBuffer(state, entity);
        writeCameraBuffer(state, entity);
        writeTransformBuffer(state, entity);
        writeSkinBuffer(state, entity);
    }
}
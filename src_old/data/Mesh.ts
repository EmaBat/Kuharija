import type { Material } from "./Material.ts";

interface MeshGPUData {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
}


export class Mesh {
    _vertices: Float32Array;
    _indices: Uint32Array;
    material: Material;

    _vertexBuffer: GPUBuffer;
    _indexBuffer: GPUBuffer;

    _isLoaded: boolean;

    constructor(vertices: Float32Array, indices: Uint32Array, material: Material, device: GPUDevice) {
        this._vertices = vertices;
        this._indices = indices;
        this.material = material;
        this._vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this._indexBuffer = device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        this._isLoaded = false;
    }

    getBuffers(device: GPUDevice): MeshGPUData {
        if (!this._isLoaded) {
            device.queue.writeBuffer(this._vertexBuffer, 0, this._vertices);
            device.queue.writeBuffer(this._indexBuffer, 0, this._indices);
            this._isLoaded = true;
        }
        return {
            vertexBuffer: this._vertexBuffer,
            indexBuffer: this._indexBuffer
        };
    }
}
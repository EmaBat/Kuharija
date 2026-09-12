export interface Mesh {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
}

// hrani vse naložene meshe
// več objektov si lahko deli en mesh
export class MeshRegistry {
    private meshes: Mesh[] = [];

    constructor(private device: GPUDevice) {}

    create(vertices: Float32Array, indices: Uint32Array): number {
        const vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(vertexBuffer, 0, vertices);

        const indexBuffer = this.device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(indexBuffer, 0, indices);

        this.meshes.push({ vertexBuffer, indexBuffer, indexCount: indices.length });
        return this.meshes.length - 1;
    }

    get(id: number): Mesh {
        return this.meshes[id];
    }
}
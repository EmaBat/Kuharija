import { Scene } from "../data/Scene.ts";
import type { GlTF } from "./GLTFData.ts";

export class GLTFParser {
    data: GlTF | null = null;
    buffers: Uint8Array[] = [];

    async setJson(content: string) {
        this.data = JSON.parse(content);
        console.log(this.data);
    }

    async setBinary(content: Uint8Array) {       
        const dataView = new DataView(content.buffer, content.byteOffset, content.byteLength);
        const magic = dataView.getUint32(0, true);
        const version = dataView.getUint32(4, true);
        const totalLength = dataView.getUint32(8, true);

        if (magic != 1179937895) {
            throw Error("GLTF Magic Error: Not a valid GLTF file!");
        }
        if (version != 2) {
            throw Error("GLTF Version Error: Unsupported GLTF version!");
        }
        if (totalLength > content.byteLength) {
            throw Error("GLTF Size Error: GLB length exceeds buffer size!");
        }

        const JSON_CHUNK_TYPE = 0x4e4f534a;
        const BIN_CHUNK_TYPE = 0x004e4942;

        let spec: string | undefined;
        let binaryChunks = [];

        let offset = 12;
        while (offset < totalLength) {
            const chunkLength = dataView.getUint32(offset, true);
            const chunkType = dataView.getUint32(offset + 4, true);
            const chunkStart = offset + 8;
            const chunkData = content.slice(chunkStart, chunkStart + chunkLength);

            if (chunkType == JSON_CHUNK_TYPE) {
                spec = new TextDecoder('utf-8').decode(chunkData);
            } else if (chunkType == BIN_CHUNK_TYPE) {
                binaryChunks.push(chunkData);
            }

            offset = chunkStart + chunkLength;
        }

        if (spec === undefined) {
            throw Error("GLTF Error: No JSON content!");
        }

        this.data = JSON.parse(spec);
        this.buffers = binaryChunks;
        console.log(this.data);
    }

    parseScene(index: number) {
        const scene = new Scene();

        // TODO

        return scene;
    }

    parseNode() {

    }
}
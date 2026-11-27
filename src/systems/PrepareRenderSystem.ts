import { Camera } from "../components/Camera.ts";
import { Mesh } from "../components/Mesh.ts";
import { BasicMaterial, LitMaterial } from "../data/Material.ts";
import { UnlitRenderer } from "../renderers/UnlitRenderer.ts";
import { LitRenderer } from "../renderers/LitRenderer.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";


/**
 * A system that prepares the render state for rendering.
 * Prepares textures and renderers.
 * @param state render state
 * @param scene current scene
 */
export async function prepareRendering(state: RenderState, scene: Scene) {
    console.log("Preparing textures...");

    for (const entity of scene.entities) {
        const mesh = entity.getComponent(Mesh);
        if (mesh) {
            const unlit_primitives = mesh.getPrimitivesByMaterial(BasicMaterial) ?? [];
            const lit_primitives = mesh.getPrimitivesByMaterial(LitMaterial) ?? [];
            for (const primitive of unlit_primitives) {
                const material = primitive.material as BasicMaterial;
                const image = material.baseTexture;
                state.createImageTexture(image);
            }
            for (const primitive of lit_primitives) {
                const material = primitive.material as LitMaterial;
                const image = material.baseTexture;
                state.createImageTexture(image);
            }
        }
    }


    console.log("Preparing renderers...");
    
    // Unlit renderer
    const camera = scene.getEntitiesByComponent(Camera)[0];
    const unlitRenderer = new UnlitRenderer(
        scene,
        camera,
        state.sceneDepthTexture.texture.format,
        state.canvasViewFormat,
        state
    );
    state.unlitRenderer = unlitRenderer;

    const litRenderer = new LitRenderer(
        scene,
        camera,
        state.sceneDepthTexture.texture.format,
        state.canvasViewFormat,
        state
    );
    state.litRenderer = litRenderer;
}
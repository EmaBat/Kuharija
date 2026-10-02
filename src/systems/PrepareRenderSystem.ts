import { Camera } from "../components/Camera.ts";
import { UnlitRenderer } from "../renderers/UnlitRenderer.ts";
import type { RenderState } from "../RenderState.ts";
import type { Scene } from "../Scene.ts";


export async function prepareRendering(state: RenderState, scene: Scene) {
    console.log("Preparing textures...");
    const sceneDepthTexture = state.createDepthTexture('sceneDepth');
    
    console.log("Preparing renderers...");
    
    // Unlit renderer
    const camera = scene.getEntitiesByComponent(Camera)[0];
    const unlitRenderer = new UnlitRenderer(
        scene,
        camera,
        sceneDepthTexture.format,
        state.canvasFormat,
        state.device
    );
    state.unlitRenderer = unlitRenderer;
}
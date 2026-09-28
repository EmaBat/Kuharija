import { mat4 } from "gl-matrix";
import { Scene } from "../data/Scene.ts";
import { LocalTransform } from "../components/LocalTransformComponent.ts";
import { GlobalTransform } from "../components/GlobalTransformComponent.ts";

function updateTransforms(scene: Scene) {
    for (const entity of scene.entities) {
        // We recursivelly traverse the entity hierarchies
        const entityParentStack = [entity];
        while (entityParentStack.length > 0) {
            const entity = entityParentStack.pop()!;

            const localTransforms = entity.getComponentsByType(LocalTransform);
            let globalTransforms = entity.getComponentsByType(GlobalTransform);
            
            if (localTransforms.length == 0) { continue; }
    
            // If entity has a local transform, it seems appropriate
            // to also have a global transform.
            if (globalTransforms.length == 0) {
                const transform = new GlobalTransform();
                entity.addComponent(transform);
                globalTransforms.push(transform);
            }
            const globalMatrix = mat4.create();
    
            // Since there can be multiple local transforms, we multiply them
            // from first to last - left to right.
            for (const localTransform of localTransforms) {
                mat4.multiply(globalMatrix, globalMatrix, localTransform.localMatrix);
            }
    
            globalTransforms[0].globalMatrix = globalMatrix;

            entityParentStack.push(...entity.children);
        }
    }
}
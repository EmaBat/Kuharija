import { mat4, vec3 } from "gl-matrix";
import type { Entity } from "../Entity.ts";
import {
    Transform,
    TransformType,
} from "../components/Transform.ts";

export class OrbitCameraController {
    yaw = 0;
    pitch = 0.4;

    distance = 7;
    targetHeight = 1;
    sensitivity = 0.005;

    constructor(canvas: HTMLCanvasElement) {
        // Izklop menija ob desnem kliku na platno.
        canvas.addEventListener("contextmenu", event => {
            event.preventDefault();
        });

        canvas.addEventListener("pointerdown", event => {
            if (event.button === 2) {
                canvas.setPointerCapture(event.pointerId);
            }
        });

        canvas.addEventListener("pointermove", event => {
            // Bit 2 pomeni pritisnjen desni gumb.
            if ((event.buttons & 2) === 0) {
                return;
            }

            this.yaw -= event.movementX * this.sensitivity;
            this.pitch += event.movementY * this.sensitivity;

            this.pitch = Math.max(
                0.1,
                Math.min(1.3, this.pitch),
            );
        });

        canvas.addEventListener("pointerup", event => {
            if (
                event.button === 2 &&
                canvas.hasPointerCapture(event.pointerId)
            ) {
                canvas.releasePointerCapture(event.pointerId);
            }
        });
    }
}

//ta funk. izracuna polozaj kamere glede na igralca in se v main.ts izvede ob vsaki posodobitvi igre
export function followPlayer(
    cameraEntity: Entity,
    player: Entity,
    orbit: OrbitCameraController,
) {
    const cameraTransform = cameraEntity.getComponent(Transform);
    const playerTransform = player.getComponent(Transform);

    if (!cameraTransform || !playerTransform) {
        return;
    }

    // Svetovni položaj igralke iz njene matrike modela.
    const target = vec3.create();

    mat4.getTranslation(
        target,
        playerTransform.worldMatrix,
    );

    target[1] += orbit.targetHeight;

    // Začetni odmik kamere od točke pogleda.
    const offset = vec3.fromValues(0, 0, orbit.distance);

    // M = Ry(yaw) * Rx(-pitch).
    // Na odmik se najprej uporabi naklon, nato vrtenje okoli Y.
    const rotation = mat4.create();

    mat4.rotateY(rotation, rotation, orbit.yaw);
    mat4.rotateX(rotation, rotation, -orbit.pitch);

    vec3.transformMat4(offset, offset, rotation);

    const cameraPosition = vec3.create();
    vec3.add(cameraPosition, target, offset);

    cameraTransform.transformType = TransformType.LookAt;
    cameraTransform.location = cameraPosition;
    cameraTransform.target = target;
    cameraTransform.up = vec3.fromValues(0, 1, 0);
}
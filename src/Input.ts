export class Input {
    private pressedKeys = new Set<string>();

    constructor() {
        window.addEventListener("keydown", event => {
            if (this.isMovementKey(event.code)) {
                event.preventDefault();
                this.pressedKeys.add(event.code);
            }
        });

        window.addEventListener("keyup", event => {
            this.pressedKeys.delete(event.code);
        });

        window.addEventListener("blur", () => {
            this.pressedKeys.clear();
        });
    }

    isDown(code: string): boolean {
        return this.pressedKeys.has(code);
    }

    private isMovementKey(code: string): boolean {
        return [
            "KeyW", "KeyA", "KeyS", "KeyD",
            "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
        ].includes(code);
    }
}
export class Input {
    private pressedKeys = new Set<string>();
    private justPressedKeys = new Set<string>();

    /*
    event.code:= katera tioka (KeyW", "KeyA",..."Enter"...)
    */
    constructor() {
        window.addEventListener("keydown", event => {
            if (this.isMovementKey(event.code) || this.isLogicKey(event.code)) {
                event.preventDefault();
        
                if (!this.pressedKeys.has(event.code)) {
                    this.justPressedKeys.add(event.code);
                }
        
                this.pressedKeys.add(event.code);
            }
        });

        window.addEventListener("keyup", event => {
            this.pressedKeys.delete(event.code);
        });

        window.addEventListener("blur", () => {
            this.pressedKeys.clear();
            this.justPressedKeys.clear();
        });
    }

    isDown(code: string): boolean {
        return this.pressedKeys.has(code);
    }

    endFrame(): void {
        this.justPressedKeys.clear();
    }

    justPressed(code: string): boolean {
        return this.justPressedKeys.has(code);
    }

    //tipke definirane za premikanje
    private isMovementKey(code: string): boolean {
        return [
            "KeyW", "KeyA", "KeyS", "KeyD",
            "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
        ].includes(code);
    }

    //tipke definirane za logiko igre
    private isLogicKey(code: string): boolean {
        return [
            "Enter"
        ].includes(code);
    }
}
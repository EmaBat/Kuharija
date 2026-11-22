export class Input {
    private pressedKeys = new Set<string>();
    private justPressedKeys = new Set<string>();
    private mouseX: number = 0; //private ker ne zelimo da jih lahko v main spreminjamo, zato imamo spodaj getter, P1 flashback
    private mouseY: number = 0;
    private mouseClicked: boolean = false;
    /*
    event.code:= katera tioka (KeyW", "KeyA",..."Enter"...)
    */
    constructor(canvas: HTMLCanvasElement) {
        window.addEventListener("keydown", event => {
            if (this.isMovementKey(event.code) || this.isLogicKey(event.code)) {
                event.preventDefault();
        
                if (!this.pressedKeys.has(event.code)) {
                    this.justPressedKeys.add(event.code);
                }
        
                this.pressedKeys.add(event.code);
            }
        });
        //canvas zato ker zelimo zaznati klik miske samo znotraj igralnega polja!
        canvas.addEventListener("mousedown", event => {
            const dimenzije = canvas.getBoundingClientRect(); //v dimenzije se shranijo dimezije canvasa
            this.mouseClicked=true;
            //ce canvas ni v levem top robu brskalnika bomo imele tezavo, zato tukej preventivno odstejem left in top
            this.mouseX=event.clientX - dimenzije.left;
            this.mouseY=event.clientY - dimenzije.top;
            this.mouseX=2*(this.mouseX/dimenzije.width)-1;
            this.mouseY=1-2*(this.mouseY/dimenzije.height);
            console.log("Klik miske! ndc:", this.mouseX, this.mouseY);
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
        this.mouseClicked = false;
    }

    justClicked(): boolean {
        return this.mouseClicked;
    }

    justPressed(code: string): boolean {
        return this.justPressedKeys.has(code);
    }

    getMouseX(): number {
        return this.mouseX;
    }
    
    getMouseY(): number {
        return this.mouseY;
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
            "Enter", "Space", "KeyX"
        ].includes(code);
    }
}
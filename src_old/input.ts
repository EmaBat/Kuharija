export class Input {
    mouseDx = 0; 
    mouseDy = 0;
    wheel = 0;
    private dragging = false;

    attach(canvas: HTMLCanvasElement) {
        canvas.addEventListener('pointerdown', e => {
            this.dragging = true;
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointerup', e => {
            this.dragging = false;
            canvas.releasePointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', e => {
            if (this.dragging) {
                this.mouseDx += e.movementX;
                this.mouseDy += e.movementY;
            }
        });
        canvas.addEventListener('wheel', e => {
            this.wheel += e.deltaY;
            e.preventDefault();
        }, { passive: false });
    }
    
    endFrame() {
        this.mouseDx = 0;
        this.mouseDy = 0;
        this.wheel = 0;
    }
}
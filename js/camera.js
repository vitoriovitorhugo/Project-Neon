/* ============================================
   camera.js — Side-scrolling camera
   Player stays at the first 1/3 of viewport.
   ============================================ */

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    update(playerX, viewportWidth) {
        this.x = playerX - viewportWidth * 0.33;
        if (this.x < 0) this.x = 0;
    }
}

/* ============================================
   player.js — Player (Cube) controller
   Physics, input, rotation, hitbox
   ============================================ */

import { TILE } from './objects.js';

export class Player {
    constructor(groundY) {
        this.size = TILE;
        this.groundY = groundY;

        // Position
        this.startX = 100;
        this.x = this.startX;
        this.y = groundY - this.size;

        // Physics
        this.vy = 0;
        this.gravity = 0.9;
        this.jumpForce = -14;
        this.onGround = true;
        this.dead = false;

        // Rotation visual
        this.rotation = 0;
        this.targetRotation = 0;

        // Input
        this.jumpPressed = false;
        this.jumpJustPressed = false;
        this._prevPressed = false;

        // Visual
        this.color = '#00ffcc';
        this.glowColor = '#00ffcc';
        this.trail = [];
    }

    /** Bind input listeners */
    bindInput(canvas) {
        const setPressed = (val) => { this.jumpPressed = val; };

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                setPressed(true);
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.key === ' ') setPressed(false);
        });

        // Mouse
        canvas.addEventListener('mousedown', (e) => { e.preventDefault(); setPressed(true); });
        canvas.addEventListener('mouseup', () => setPressed(false));

        // Touch
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); setPressed(true); }, { passive: false });
        canvas.addEventListener('touchend', () => setPressed(false));
    }

    /** Call once per frame BEFORE physics to update justPressed */
    updateInput() {
        this.jumpJustPressed = this.jumpPressed && !this._prevPressed;
        this._prevPressed = this.jumpPressed;
    }

    /** Attempt a jump */
    tryJump() {
        if (this.onGround && this.jumpPressed) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.targetRotation += Math.PI / 2;
            return true;
        }
        return false;
    }

    /** Air jump (from orbs) */
    airJump() {
        this.vy = this.jumpForce;
        this.targetRotation += Math.PI / 2;
    }

    /** Launch (from pads) */
    launch(force) {
        this.vy = force;
        this.onGround = false;
        this.targetRotation += Math.PI / 2;
    }

    /** Apply gravity and move vertically */
    applyGravity() {
        this.vy += this.gravity;
        this.y += this.vy;

        // Ground collision
        if (this.y >= this.groundY - this.size) {
            this.y = this.groundY - this.size;
            this.vy = 0;
            this.onGround = true;
        }
    }

    /** Get reduced hitbox for forgiving collision */
    getHitbox() {
        const s = 5; // shrink pixels per side
        return {
            x: this.x + s,
            y: this.y + s,
            width: this.size - s * 2,
            height: this.size - s * 2
        };
    }

    /** Die */
    die() {
        this.dead = true;
    }

    /** Reset to start */
    reset() {
        this.x = this.startX;
        this.y = this.groundY - this.size;
        this.vy = 0;
        this.onGround = true;
        this.dead = false;
        this.rotation = 0;
        this.targetRotation = 0;
        this.trail = [];
    }

    /** Update rotation visual */
    updateRotation() {
        // Smooth rotation towards target
        const diff = this.targetRotation - this.rotation;
        this.rotation += diff * 0.2;

        // Snap when close
        if (Math.abs(diff) < 0.01) {
            this.rotation = this.targetRotation;
        }

        // On ground, snap to nearest 90°
        if (this.onGround) {
            this.targetRotation = Math.round(this.targetRotation / (Math.PI / 2)) * (Math.PI / 2);
        }
    }

    /** Update trail particles */
    updateTrail() {
        this.trail.push({
            x: this.x,
            y: this.y + this.size / 2,
            alpha: 0.6,
            size: this.size * 0.3
        });
        // Decay
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha -= 0.04;
            this.trail[i].size *= 0.95;
            if (this.trail[i].alpha <= 0) this.trail.splice(i, 1);
        }
    }

    /** Render the player cube */
    render(ctx) {
        // Trail
        for (const t of this.trail) {
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.fillStyle = this.glowColor;
            ctx.fillRect(t.x - t.size / 2, t.y - t.size / 2, t.size, t.size);
        }
        ctx.globalAlpha = 1;

        // Cube with rotation
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        // Glow
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 16;

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Inner detail (eye/icon)
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-this.size / 4, -this.size / 4, this.size / 2, this.size / 2);

        ctx.restore();
    }
}

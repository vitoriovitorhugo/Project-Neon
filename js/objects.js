/* ============================================
   objects.js — Game Object Classes
   Block, Spike, Pad, Orb, EndMarker
   ============================================ */

export const TILE = 40;

// ── Base class ──
class GameObject {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    getHitbox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// ── Block — Solid platform ──
export class Block extends GameObject {
    constructor(x, y) {
        super(x, y, TILE, TILE);
    }
    render(ctx, color) {
        // Fill
        ctx.fillStyle = color || '#1a1aff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Neon border
        ctx.strokeStyle = '#4d4dff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
    }
}

// ── Spike — Triangle obstacle, instant death ──
export class Spike extends GameObject {
    constructor(x, y) {
        super(x, y, TILE, TILE);
    }
    getHitbox() {
        // Reduced hitbox: inner area of triangle
        const shrink = 8;
        return {
            x: this.x + shrink,
            y: this.y + shrink,
            width: this.width - shrink * 2,
            height: this.height - shrink
        };
    }
    render(ctx, color) {
        const cx = this.x + this.width / 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fillStyle = color || '#ff3366';
        ctx.fill();
        // Glow
        ctx.save();
        ctx.shadowColor = color || '#ff3366';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ff6699';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}

// ── Pad — Trampoline, auto-launch ──
export class Pad extends GameObject {
    constructor(x, y, force) {
        super(x, y, TILE, TILE / 3);
        this.y = y + TILE - this.height; // sit at bottom of tile cell
        this.force = force || -18;
        this.animTimer = 0;
    }
    render(ctx, _color, time) {
        this.animTimer = time || 0;
        const pulse = 0.8 + 0.2 * Math.sin(this.animTimer * 8);
        const h = this.height * pulse;
        ctx.save();
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(this.x + 2, this.y + this.height - h, this.width - 4, h);
        ctx.restore();
        // Arrow indicator
        const cx = this.x + this.width / 2;
        const arrowY = this.y - 6;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(cx, arrowY - 6);
        ctx.lineTo(cx + 5, arrowY);
        ctx.lineTo(cx - 5, arrowY);
        ctx.closePath();
        ctx.fill();
    }
}

// ── Orb — Air-jump when clicked ──
export class Orb extends GameObject {
    constructor(x, y) {
        super(x, y, TILE, TILE);
        this.radius = TILE / 2 - 4;
        this.used = false;
    }
    getHitbox() {
        // Generous hitbox for orbs (easier to activate)
        return {
            x: this.x - 4,
            y: this.y - 4,
            width: this.width + 8,
            height: this.height + 8
        };
    }
    reset() {
        this.used = false;
    }
    render(ctx, _color, time) {
        if (this.used) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const t = time || 0;
        // Outer halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius + 6 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        // Core
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.restore();
        // Inner highlight
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
    }
}

// ── End marker ──
export class EndMarker extends GameObject {
    constructor(x, y) {
        super(x, y, TILE, TILE * 4);
        this.y = y - TILE * 3; // tall marker
    }
    render() { /* invisible */ }
}

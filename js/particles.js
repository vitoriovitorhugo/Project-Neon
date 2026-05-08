/* ============================================
   particles.js — Death explosion & effects
   ============================================ */

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /** Spawn death explosion at (x, y) */
    explode(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
            const speed = 3 + Math.random() * 6;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 3 + Math.random() * 6,
                alpha: 1,
                color: color,
                gravity: 0.15,
                decay: 0.015 + Math.random() * 0.01
            });
        }
    }

    /** Update all particles */
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.alpha -= p.decay;
            p.size *= 0.98;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /** Render all particles */
    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    /** Are there active particles? */
    get active() {
        return this.particles.length > 0;
    }

    clear() {
        this.particles.length = 0;
    }
}

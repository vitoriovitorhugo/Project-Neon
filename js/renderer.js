/* ============================================
   renderer.js — Background, ground, grid, glow
   ============================================ */

import { TILE } from './objects.js';

export class Renderer {
    constructor() {
        this.bgStars = [];
        this._starsGenerated = false;
    }

    /** Generate background stars (once) */
    _generateStars(w, h) {
        if (this._starsGenerated) return;
        this.bgStars = [];
        for (let i = 0; i < 80; i++) {
            this.bgStars.push({
                x: Math.random() * w * 3,
                y: Math.random() * h * 0.7,
                r: 0.5 + Math.random() * 1.5,
                speed: 0.1 + Math.random() * 0.3,
                flicker: Math.random() * Math.PI * 2
            });
        }
        this._starsGenerated = true;
    }

    /** Draw the background gradient */
    renderBackground(ctx, w, h, bgColor, time) {
        // Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, bgColor || '#0a0a2e');
        grad.addColorStop(0.6, '#0d0d3a');
        grad.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars (parallax — move slower than camera)
        this._generateStars(w, h);
        for (const s of this.bgStars) {
            const alpha = 0.3 + 0.3 * Math.sin(time * 2 + s.flicker);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x % w, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /** Draw the ground with grid lines */
    renderGround(ctx, cameraX, gameW, groundY, totalH, groundColor, time) {
        // Ground fill
        const groundH = totalH - groundY;
        ctx.fillStyle = groundColor || '#1a1aff';
        ctx.fillRect(0, groundY, gameW, groundH);

        // Subtle gradient overlay
        const gg = ctx.createLinearGradient(0, groundY, 0, totalH);
        gg.addColorStop(0, 'rgba(255,255,255,0.08)');
        gg.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gg;
        ctx.fillRect(0, groundY, gameW, groundH);

        // Ground top line glow
        ctx.save();
        ctx.shadowColor = groundColor || '#1a1aff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#4d4dff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(gameW, groundY);
        ctx.stroke();
        ctx.restore();

        // Grid lines on ground (vertical, scrolling)
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.15)';
        ctx.lineWidth = 1;
        const startCol = Math.floor(cameraX / TILE) * TILE - cameraX;
        for (let x = startCol; x < gameW; x += TILE) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x, totalH);
            ctx.stroke();
        }
        // Horizontal grid on ground
        for (let y = groundY + TILE; y < totalH; y += TILE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(gameW, y);
            ctx.stroke();
        }

        // Beat flash on ground line
        const beatPulse = Math.sin(time * Math.PI * 4.67); // ~140bpm visual
        if (beatPulse > 0.9) {
            ctx.save();
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(gameW, groundY);
            ctx.stroke();
            ctx.restore();
        }
    }

    /** Render screen flash (on death) */
    renderFlash(ctx, w, h, alpha, color) {
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color || '#ff0000';
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
    }
}

/* ============================================
   ui.js — Menu, HUD, Game Over, Victory
   ============================================ */

export class UI {
    constructor() {
        this.menuParticles = [];
        this._menuInit = false;
    }

    // ── Menu particles ──
    _initMenuParticles(w, h) {
        if (this._menuInit) return;
        for (let i = 0; i < 40; i++) {
            this.menuParticles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.3 - Math.random() * 0.5,
                size: 2 + Math.random() * 4,
                alpha: 0.2 + Math.random() * 0.4,
                color: ['#00ffff', '#ff00ff', '#39ff14', '#ffcc00'][Math.floor(Math.random() * 4)]
            });
        }
        this._menuInit = true;
    }

    // ── Main Menu ──
    renderMenu(ctx, w, h, time) {
        this._initMenuParticles(w, h);

        // Background
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0a0a2e');
        grad.addColorStop(0.5, '#150a30');
        grad.addColorStop(1, '#0a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floating particles
        for (const p of this.menuParticles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;

            ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(time * 2 + p.x));
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Title
        const titleY = h * 0.3;
        const pulse = 1 + 0.03 * Math.sin(time * 3);

        ctx.save();
        ctx.translate(w / 2, titleY);
        ctx.scale(pulse, pulse);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.min(w * 0.09, 72)}px Orbitron`;

        // Text glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00ffff';
        ctx.fillText('NEON', 0, -Math.min(w * 0.05, 40));

        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('JUMP', 0, Math.min(w * 0.05, 40));

        ctx.restore();

        // Subtitle
        ctx.textAlign = 'center';
        ctx.font = `${Math.min(w * 0.025, 16)}px Orbitron`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('RHYTHM ACTION PLATFORMER', w / 2, titleY + Math.min(w * 0.1, 80));

        // Play button
        const btnW = Math.min(240, w * 0.35);
        const btnH = 56;
        const btnX = w / 2 - btnW / 2;
        const btnY = h * 0.55;

        const btnGlow = 0.6 + 0.4 * Math.sin(time * 4);
        ctx.save();
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15 * btnGlow;

        // Button bg
        ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Button text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.min(24, w * 0.04)}px Orbitron`;
        ctx.fillStyle = '#00ffcc';
        ctx.fillText('▶  PLAY', w / 2, btnY + btnH / 2);

        // Store button bounds for click detection
        this._playBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Instructions
        ctx.font = `${Math.min(13, w * 0.02)}px Orbitron`;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('SPACE / CLICK / TAP TO JUMP', w / 2, h * 0.75);

        // Footer
        ctx.font = `${Math.min(11, w * 0.015)}px Orbitron`;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillText('PROJECT NEON JUMP — 2026', w / 2, h - 30);
    }

    /** Check if a click/tap hit the Play button */
    isPlayClicked(clickX, clickY) {
        if (!this._playBtnBounds) return false;
        const b = this._playBtnBounds;
        return clickX >= b.x && clickX <= b.x + b.w &&
               clickY >= b.y && clickY <= b.y + b.h;
    }

    // ── HUD (progress bar) ──
    renderHUD(ctx, w, progress, attempts) {
        const barW = w * 0.4;
        const barH = 6;
        const barX = w / 2 - barW / 2;
        const barY = 20;

        // Bar background
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();

        // Bar fill
        const fillW = barW * Math.min(1, Math.max(0, progress));
        if (fillW > 0) {
            const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            barGrad.addColorStop(0, '#00ffff');
            barGrad.addColorStop(1, '#ff00ff');
            ctx.fillStyle = barGrad;
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillW, barH, 3);
            ctx.fill();
        }

        // Percentage text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '11px Orbitron';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${Math.floor(progress * 100)}%`, w / 2, barY + barH + 4);

        // Attempts counter
        if (attempts > 0) {
            ctx.textAlign = 'right';
            ctx.font = '11px Orbitron';
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillText(`Attempt ${attempts}`, w - 20, 20);
        }
    }

    // ── Victory screen ──
    renderVictory(ctx, w, h, time, attempts) {
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        const pulse = 1 + 0.04 * Math.sin(time * 5);

        ctx.save();
        ctx.translate(w / 2, h * 0.35);
        ctx.scale(pulse, pulse);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.font = `bold ${Math.min(48, w * 0.07)}px Orbitron`;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#39ff14';
        ctx.fillText('LEVEL COMPLETE!', 0, 0);
        ctx.restore();

        // Stats
        ctx.textAlign = 'center';
        ctx.font = `${Math.min(18, w * 0.03)}px Orbitron`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`Attempts: ${attempts}`, w / 2, h * 0.5);

        // Instruction
        const blink = Math.sin(time * 4) > 0;
        if (blink) {
            ctx.font = `${Math.min(14, w * 0.022)}px Orbitron`;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText('CLICK TO RETURN TO MENU', w / 2, h * 0.65);
        }
    }
}

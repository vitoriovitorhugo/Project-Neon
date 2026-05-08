/* ============================================
   game.js — Game state machine & orchestrator
   States: MENU, PLAYING, DEAD, WON
   ============================================ */

import { Player } from './player.js';
import { Camera } from './camera.js';
import { Level } from './level.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';
import { aabbOverlap } from './collision.js';
import { TILE } from './objects.js';

// Game-world constants
const GROUND_Y = 440;
const GAME_HEIGHT = 500;

export const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    DEAD: 'DEAD',
    WON: 'WON'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.state = STATE.MENU;
        this.time = 0;

        // Subsystems
        this.player = new Player(GROUND_Y);
        this.camera = new Camera();
        this.level = new Level();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.ui = new UI();
        this.renderer = new Renderer();

        // Stats
        this.attempts = 0;
        this.deathTimer = 0;
        this.flashAlpha = 0;

        // Scaling
        this.scale = 1;
        this.gameWidth = 800;

        // Input binding
        this.player.bindInput(canvas);
        this._bindMenuInput(canvas);
    }

    /** Bind click/tap for menu interaction */
    _bindMenuInput(canvas) {
        const handler = (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            // Convert to game coordinates
            const clickX = (clientX - rect.left) / this.scale;
            const clickY = (clientY - rect.top) / this.scale;

            if (this.state === STATE.MENU) {
                if (this.ui.isPlayClicked(clickX, clickY)) {
                    this.startLevel();
                }
            } else if (this.state === STATE.WON) {
                this.state = STATE.MENU;
            }
        };
        canvas.addEventListener('click', handler);
        canvas.addEventListener('touchstart', handler, { passive: false });
    }

    /** Start / restart the current level */
    async startLevel() {
        // Init audio on first user gesture
        this.audio.init();
        await this.audio.resume();

        // Load level
        await this.level.load('assets/levels/level1.json', GROUND_Y);

        // Set audio BPM
        this.audio.bpm = this.level.bpm;

        // Reset player
        this.player.reset();
        this.level.resetOrbs();
        this.particles.clear();
        this.attempts = 1;
        this.deathTimer = 0;
        this.flashAlpha = 0;

        // Start music
        if (this.level.musicSrc) {
            const loaded = await this.audio.load(this.level.musicSrc);
            if (loaded) this.audio.play();
            else this.audio.playProceduralBeat();
        } else {
            this.audio.playProceduralBeat();
        }

        this.state = STATE.PLAYING;
    }

    /** Restart after death */
    _restart() {
        this.player.reset();
        this.level.resetOrbs();
        this.particles.clear();
        this.attempts++;
        this.deathTimer = 0;
        this.flashAlpha = 0;

        // Restart music
        if (this.level.musicSrc && this.audio.buffer) {
            this.audio.play();
        } else {
            this.audio.playProceduralBeat();
        }

        this.state = STATE.PLAYING;
    }

    /** Calculate viewport scale */
    updateScale() {
        this.scale = this.canvas.height / GAME_HEIGHT;
        this.gameWidth = this.canvas.width / this.scale;
    }

    // ══════════════════════════════════════
    //  UPDATE
    // ══════════════════════════════════════
    update(dt) {
        this.time += dt;
        this.updateScale();

        switch (this.state) {
            case STATE.MENU:
                break;

            case STATE.PLAYING:
                this._updatePlaying(dt);
                break;

            case STATE.DEAD:
                this._updateDead(dt);
                break;

            case STATE.WON:
                break;
        }
    }

    _updatePlaying(_dt) {
        const p = this.player;
        const speed = this.level.speed;

        // Input
        p.updateInput();

        // ── Phase 1: Move X ──
        const prevX = p.x;
        p.x += speed;

        // Check block collision (horizontal → death)
        const hbox = p.getHitbox();
        for (const block of this.level.blocks) {
            if (aabbOverlap(hbox, block.getHitbox())) {
                // Player ran into the side of a block
                p.x = prevX; // rollback
                p.x += speed; // try again for the check
                // Actually check if it's truly a side hit
                const ph = p.getHitbox();
                const bh = block.getHitbox();
                if (aabbOverlap(ph, bh)) {
                    // Confirm: check if player's bottom was above block's top before
                    // If so, this is a landing scenario handled in Y phase
                    // If not, it's a wall → die
                    const playerBottom = p.y + p.size;
                    const blockTop = block.y;
                    if (playerBottom > blockTop + 4) {
                        // Player is not above the block → wall collision → die
                        this._die();
                        return;
                    }
                }
            }
        }

        // ── Phase 2: Try jump ──
        p.tryJump();
        if (p.jumpJustPressed && !p.onGround) {
            // Check orb interaction
            for (const orb of this.level.orbs) {
                if (!orb.used && aabbOverlap(p.getHitbox(), orb.getHitbox())) {
                    orb.used = true;
                    p.airJump();
                    this.audio.playSFX('jump');
                    break;
                }
            }
        }
        if (p.vy === p.jumpForce && p.vy !== 0) {
            this.audio.playSFX('jump');
        }

        // ── Phase 3: Move Y (gravity) ──
        p.applyGravity();

        // Check block collision (vertical → land or head bump)
        for (const block of this.level.blocks) {
            const ph = p.getHitbox();
            const bh = block.getHitbox();
            if (aabbOverlap(ph, bh)) {
                if (p.vy > 0) {
                    // Landing on top
                    p.y = block.y - p.size;
                    p.vy = 0;
                    p.onGround = true;
                } else if (p.vy < 0) {
                    // Head bump
                    p.y = block.y + block.height;
                    p.vy = 0;
                }
            }
        }

        // ── Phase 4: Check spikes ──
        for (const spike of this.level.spikes) {
            if (aabbOverlap(p.getHitbox(), spike.getHitbox())) {
                this._die();
                return;
            }
        }

        // ── Phase 5: Check pads ──
        for (const pad of this.level.pads) {
            if (aabbOverlap(p.getHitbox(), pad.getHitbox())) {
                p.launch(pad.force);
                this.audio.playSFX('jump');
            }
        }

        // ── Phase 6: Check win ──
        if (this.level.endX > 0 && p.x >= this.level.endX) {
            this.state = STATE.WON;
            this.audio.stop();
            this.audio.playSFX('win');
            return;
        }

        // Visuals
        p.updateRotation();
        p.updateTrail();

        // Camera
        this.camera.update(p.x, this.gameWidth);
    }

    _die() {
        const p = this.player;
        p.die();
        this.particles.explode(
            p.x + p.size / 2,
            p.y + p.size / 2,
            p.glowColor,
            25
        );
        this.audio.playSFX('die');
        this.flashAlpha = 0.5;
        this.deathTimer = 0;
        this.state = STATE.DEAD;
    }

    _updateDead(dt) {
        this.deathTimer += dt;
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
        this.particles.update();

        // Auto-restart after 500ms
        if (this.deathTimer > 0.5) {
            this._restart();
        }
    }

    // ══════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════
    render(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (this.state === STATE.MENU) {
            // Menu is rendered in screen space (no scaling)
            this.ui.renderMenu(ctx, w, h, this.time);
            return;
        }

        // Apply game-world scaling
        ctx.save();
        ctx.scale(this.scale, this.scale);

        const gw = this.gameWidth;
        const gh = GAME_HEIGHT;
        const camX = this.camera.x;

        // Background (fixed)
        this.renderer.renderBackground(ctx, gw, gh, this.level.bgColor, this.time);

        // Translate for camera
        ctx.save();
        ctx.translate(-camX, 0);

        // Ground
        this.renderer.renderGround(ctx, camX, gw + camX + TILE, GROUND_Y, gh, this.level.groundColor, this.time);

        // Level objects
        this.level.render(ctx, camX, gw, this.time);

        // Player
        if (this.state !== STATE.DEAD) {
            this.player.render(ctx);
        }

        // Particles
        this.particles.render(ctx);

        ctx.restore(); // camera

        // HUD
        if (this.state === STATE.PLAYING || this.state === STATE.DEAD) {
            const progress = this.level.endX > 0
                ? this.player.x / this.level.endX
                : 0;
            this.ui.renderHUD(ctx, gw, progress, this.attempts);
        }

        // Death flash
        if (this.flashAlpha > 0) {
            this.renderer.renderFlash(ctx, gw, gh, this.flashAlpha, '#ff0033');
        }

        ctx.restore(); // scale

        // Victory overlay (screen space)
        if (this.state === STATE.WON) {
            this.ui.renderVictory(ctx, w, h, this.time, this.attempts);
        }
    }
}

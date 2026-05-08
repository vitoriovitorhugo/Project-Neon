/* ============================================
   level.js — Level loader (JSON → game objects)
   ============================================ */

import { TILE, Block, Spike, Pad, Orb, EndMarker } from './objects.js';

export class Level {
    constructor() {
        this.name = '';
        this.bpm = 140;
        this.speed = 8;
        this.musicSrc = null;
        this.bgColor = '#0a0a2e';
        this.groundColor = '#1a1aff';
        this.accentColor = '#00ffff';
        this.blocks = [];
        this.spikes = [];
        this.pads = [];
        this.orbs = [];
        this.endX = 0;
        this.allObjects = [];
    }

    /**
     * Load a level from a JSON url.
     * GROUND_Y is the top of the ground surface in game coordinates.
     */
    async load(url, groundY) {
        const res = await fetch(url);
        const data = await res.json();

        this.name = data.name || 'Untitled';
        this.bpm = data.bpm || 140;
        this.speed = data.speed || 8;
        this.musicSrc = data.music || null;
        this.bgColor = data.backgroundColor || '#0a0a2e';
        this.groundColor = data.groundColor || '#1a1aff';
        this.accentColor = data.accentColor || '#00ffff';

        this.blocks = [];
        this.spikes = [];
        this.pads = [];
        this.orbs = [];
        this.endX = 0;

        for (const obj of data.objects) {
            const x = obj.col * TILE;
            const y = groundY - (obj.row + 1) * TILE;

            switch (obj.type) {
                case 'block':
                    this.blocks.push(new Block(x, y));
                    break;
                case 'spike':
                    this.spikes.push(new Spike(x, y));
                    break;
                case 'pad':
                    this.pads.push(new Pad(x, y, obj.force));
                    break;
                case 'orb':
                    this.orbs.push(new Orb(x, y));
                    break;
                case 'end':
                    this.endX = x;
                    break;
            }
        }

        this.allObjects = [...this.blocks, ...this.spikes, ...this.pads, ...this.orbs];
    }

    /** Reset all orbs to unused */
    resetOrbs() {
        for (const orb of this.orbs) orb.reset();
    }

    /** Render all level objects */
    render(ctx, cameraX, viewportWidth, time) {
        const left = cameraX - TILE;
        const right = cameraX + viewportWidth + TILE;

        for (const b of this.blocks) {
            if (b.x > left && b.x < right) b.render(ctx, this.groundColor);
        }
        for (const s of this.spikes) {
            if (s.x > left && s.x < right) s.render(ctx, '#ff3366');
        }
        for (const p of this.pads) {
            if (p.x > left && p.x < right) p.render(ctx, null, time);
        }
        for (const o of this.orbs) {
            if (o.x > left && o.x < right) o.render(ctx, null, time);
        }
    }
}

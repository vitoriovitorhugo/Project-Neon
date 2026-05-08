/* ============================================
   audio.js — Web Audio API manager
   Music loading, playback, BPM sync
   ============================================ */

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffer = null;
        this.source = null;
        this.gainNode = null;
        this.playing = false;
        this.startTime = 0;
        this.bpm = 140;
        this._initialized = false;
    }

    /** Initialize AudioContext (must be called from user gesture) */
    init() {
        if (this._initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
        this._initialized = true;
    }

    /** Resume context if suspended (autoplay policy) */
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    /** Load an audio file into a buffer */
    async load(url) {
        if (!url || !this.ctx) return false;
        try {
            const res = await fetch(url);
            const arrayBuf = await res.arrayBuffer();
            this.buffer = await this.ctx.decodeAudioData(arrayBuf);
            return true;
        } catch (e) {
            console.warn('Audio load failed:', e);
            return false;
        }
    }

    /** Play the loaded buffer */
    play() {
        if (!this.buffer || !this.ctx) return;
        this.stop();
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gainNode);
        this.source.start(0);
        this.startTime = this.ctx.currentTime;
        this.playing = true;
    }

    /** Stop playback */
    stop() {
        if (this.source) {
            try { this.source.stop(); } catch (_) { /* already stopped */ }
            this.source = null;
        }
        this.playing = false;
    }

    /** Current playback time in seconds */
    get currentTime() {
        if (!this.playing || !this.ctx) return 0;
        return this.ctx.currentTime - this.startTime;
    }

    /** Beat interval in seconds */
    get beatInterval() {
        return 60 / this.bpm;
    }

    /** Is the current moment on a beat? (within a tolerance window) */
    isOnBeat(tolerance = 0.05) {
        const t = this.currentTime;
        const beat = this.beatInterval;
        const pos = t % beat;
        return pos < tolerance || pos > beat - tolerance;
    }

    /** Generate a simple procedural beat (fallback when no music file) */
    playProceduralBeat() {
        if (!this.ctx) return;
        this.stop();
        this.playing = true;
        this.startTime = this.ctx.currentTime;

        const beatSec = this.beatInterval;
        const duration = 120; // 2 minutes of beats
        const beats = Math.floor(duration / beatSec);

        for (let i = 0; i < beats; i++) {
            const time = this.startTime + i * beatSec;

            // Kick
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(gain);
            gain.connect(this.gainNode);
            osc.start(time);
            osc.stop(time + 0.15);

            // Hi-hat on off-beats
            if (i % 2 === 1) {
                const noise = this.ctx.createOscillator();
                const ng = this.ctx.createGain();
                noise.type = 'square';
                noise.frequency.value = 800 + Math.random() * 400;
                ng.gain.setValueAtTime(0.08, time);
                ng.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                noise.connect(ng);
                ng.connect(this.gainNode);
                noise.start(time);
                noise.stop(time + 0.05);
            }
        }
    }

    /** Play a short SFX (jump, die, win) */
    playSFX(type) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        switch (type) {
            case 'jump': {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'square';
                o.frequency.setValueAtTime(400, now);
                o.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                g.gain.setValueAtTime(0.12, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                o.connect(g);
                g.connect(this.gainNode);
                o.start(now);
                o.stop(now + 0.1);
                break;
            }
            case 'die': {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300, now);
                o.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                g.gain.setValueAtTime(0.2, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                o.connect(g);
                g.connect(this.gainNode);
                o.start(now);
                o.stop(now + 0.35);
                break;
            }
            case 'win': {
                [523, 659, 784].forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.15, now + i * 0.12);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                    o.connect(g);
                    g.connect(this.gainNode);
                    o.start(now + i * 0.12);
                    o.stop(now + i * 0.12 + 0.3);
                });
                break;
            }
        }
    }

    setVolume(v) {
        if (this.gainNode) this.gainNode.gain.value = Math.max(0, Math.min(1, v));
    }
}

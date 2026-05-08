/* ============================================
   main.js — Entry point & game loop
   Uses requestAnimationFrame with fixed timestep
   ============================================ */

import { Game } from './game.js';

// ── Canvas setup ──
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Game instance ──
const game = new Game(canvas);

// ── Game loop with fixed timestep ──
const FIXED_DT = 1 / 60; // 60 Hz physics
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    const rawDt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clamp to avoid spiral of death on tab switch
    accumulator += Math.min(rawDt, 0.1);

    // Fixed timestep updates
    while (accumulator >= FIXED_DT) {
        game.update(FIXED_DT);
        accumulator -= FIXED_DT;
    }

    // Render
    game.render(ctx);

    requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});

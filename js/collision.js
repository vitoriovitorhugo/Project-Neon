/* ============================================
   collision.js — AABB collision detection
   ============================================ */

/**
 * Check if two AABBs overlap.
 * Each box: { x, y, width, height }
 */
export function aabbOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

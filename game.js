/**
 * Joe's Juke — main loop and boot
 */
"use strict";

var lastTime = 0;
function loop(ts) {
  var dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (gameState === "play") {
    if (typeof updateSlide === "function") updateSlide(dt);
    if (typeof updateEnemies === "function") updateEnemies(dt);
    if (player.moving) {
      player.animTimer += dt;
      if (player.animTimer > 0.35 && !player.sliding) player.moving = false;
    }
  }
  if (typeof draw === "function") draw();
  requestAnimationFrame(loop);
}

resizeCanvas();
if (typeof loadAssets === "function") {
  loadAssets().then(function () {});
}
requestAnimationFrame(loop);
window.__JOEJUKE_READY__ = true;

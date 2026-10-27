/**
 * Joe's Juke — play/editor input (WASD, d-pad, swipe, paint)
 * Menu/palette arrow nav lives in keyboard-nav.js
 */
"use strict";

function selectPaletteTile(ch) {
  if (!ALL_CHARS.includes(ch)) return;
  selectedTile = ch;
  document.querySelectorAll(".palette-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.ch === selectedTile);
  });
  statusEl.textContent = "Paint: " + (TILE_LABELS[ch] || ch);
  var btn = document.querySelector('.palette-btn[data-ch="' + ch.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]');
  if (btn) btn.focus();
}

window.addEventListener("keydown", function (e) {
  var tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.key === " " || e.key === "Escape" || e.code === "Space") {
    if (gameState === "play" || gameState === "paused" || gameState === "editor") {
      e.preventDefault();
      if (typeof togglePauseMenu === "function") togglePauseMenu();
      return;
    }
  }

  if (gameState === "editor") {
    var k = e.key;
    if (k >= "0" && k <= "9") {
      e.preventDefault();
      if (typeof selectFavorite === "function") selectFavorite(parseInt(k, 10));
      return;
    }
    if (k === "[") {
      e.preventDefault();
      if (typeof cycleBrushSize === "function") cycleBrushSize(-1);
      return;
    }
    if (k === "]") {
      e.preventDefault();
      if (typeof cycleBrushSize === "function") cycleBrushSize(1);
      return;
    }
    if (k === "-" || k === "_") {
      e.preventDefault();
      if (typeof zoomOut === "function") zoomOut();
      return;
    }
    if (k === "=" || k === "+") {
      e.preventDefault();
      if (typeof zoomIn === "function") zoomIn();
      return;
    }
    if (ALL_CHARS.includes(k) && !(k >= "0" && k <= "9")) {
      selectPaletteTile(k);
    }
    return;
  }
  if (gameState !== "play") return;
  var kl = e.key.toLowerCase();
  if (kl === "arrowup" || kl === "w") tryMove(0, -1);
  else if (kl === "arrowdown" || kl === "s") tryMove(0, 1);
  else if (kl === "arrowleft" || kl === "a") tryMove(-1, 0);
  else if (kl === "arrowright" || kl === "d") tryMove(1, 0);
  else return;
  e.preventDefault();
});

document.querySelectorAll(".dpad-btn").forEach(function (btn) {
  btn.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (gameState !== "play") return;
    tryMove(parseInt(btn.dataset.dx, 10), parseInt(btn.dataset.dy, 10));
    btn.classList.add("active");
    setTimeout(function () { btn.classList.remove("active"); }, 120);
  });
});

function onTouchStart(e) {
  if (gameState === "editor") {
    var t = e.changedTouches ? e.changedTouches[0] : e;
    if (e.button === 1 || (typeof editPanning !== "undefined" && editPanning)) {
      e.preventDefault();
      return;
    }
    if (e.altKey && typeof eyedropAt === "function") {
      eyedropAt(t.clientX, t.clientY);
      e.preventDefault();
      return;
    }
    if (e.button === 2) {
      var prev = selectedTile;
      selectedTile = FLOOR_ID;
      paintAt(t.clientX, t.clientY);
      selectedTile = prev;
      e.preventDefault();
      return;
    }
    painting = true;
    paintAt(t.clientX, t.clientY);
    e.preventDefault();
    return;
  }
  if (gameState !== "play") return;
  var t = e.changedTouches ? e.changedTouches[0] : e;
  touchStartX = t.clientX; touchStartY = t.clientY; touchActive = true;
}
function onTouchMove(e) {
  if (gameState === "editor" && painting) {
    var t = e.changedTouches ? e.changedTouches[0] : e;
    paintAt(t.clientX, t.clientY);
    e.preventDefault();
  }
}
function onTouchEnd(e) {
  if (gameState === "editor") { painting = false; return; }
  if (!touchActive || gameState !== "play") return;
  touchActive = false;
  var t = e.changedTouches ? e.changedTouches[0] : e;
  var dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 1 : -1, 0);
  else tryMove(0, dy > 0 ? 1 : -1);
}

canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
canvas.addEventListener("touchend", onTouchEnd, { passive: true });
canvas.addEventListener("mousedown", onTouchStart);
canvas.addEventListener("mousemove", function (e) {
  if (painting && gameState === "editor") paintAt(e.clientX, e.clientY);
});
canvas.addEventListener("mouseup", onTouchEnd);
canvas.addEventListener("mouseleave", function () { painting = false; });

document.getElementById("dpad").addEventListener("contextmenu", function (e) { e.preventDefault(); });
canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

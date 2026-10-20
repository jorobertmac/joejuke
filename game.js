/**
 * Joe's Juke — core state, level load, input, main loop
 */
"use strict";

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var assets = {
  ready: false,
  terrain: null,
  items: null,
  joe: null,
  block: null,
  monsters: {},
};

var COLS = 20, ROWS = 15;

var levelNumEl = document.getElementById("levelNum");
var levelTotalEl = document.getElementById("levelTotal");
var keyCountEl = document.getElementById("keyCount");
var statusEl = document.getElementById("status");
var startScreen = document.getElementById("startScreen");
var levelComplete = document.getElementById("levelComplete");
var gameOver = document.getElementById("gameOver");
var winScreen = document.getElementById("winScreen");
var editorBar = document.getElementById("editorBar");
var exportModal = document.getElementById("exportModal");
var importModal = document.getElementById("importModal");
var backToEditorBtn = document.getElementById("backToEditorBtn");
var backToEditorWinBtn = document.getElementById("backToEditorWinBtn");

var level = 0;
var chipsCollected = 0, chipsNeeded = 0;
var player = { x: 1, y: 1, dir: 0, frame: 0, moving: false, animTimer: 0 };
var enemies = [];
var map = [];
var overlay = [];
var blocks = [];
var traps = [];
var cloners = [];
var teleporters = [];
var toggleOpen = true;
var gameState = "start";
var customLevel = null, fromEditor = false;

var inv = { keys: {b:0,r:0,g:0,y:0}, boots: {flip:false, fire:false, ice:false, suction:false} };

var editMap = [], editCols = 20, editRows = 15, selectedTile = "W", painting = false;
var touchStartX = 0, touchStartY = 0, touchActive = false;
var SWIPE_THRESHOLD = 24;

function resizeCanvas() {
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
}

function parseLevel(raw) {
  const rows = raw.length;
  const cols = raw[0] ? raw[0].length : 0;
  COLS = cols; ROWS = rows;
  resizeCanvas();
  map = []; overlay = [];
  enemies = []; blocks = []; traps = []; cloners = []; teleporters = [];
  chipsCollected = 0; chipsNeeded = 0;
  inv = { keys: {b:0,r:0,g:0,y:0}, boots: {flip:false, fire:false, ice:false, suction:false} };
  toggleOpen = true;
  let foundPlayer = false;

  for (let y = 0; y < ROWS; y++) {
    map[y] = []; overlay[y] = [];
    const row = raw[y] || "";
    for (let x = 0; x < COLS; x++) {
      const ch = row[x] || ".";
      let t = T.FLOOR, ov = null;

      if (CH[ch] !== undefined) {
        const id = CH[ch];
        if (id >= T.KEY_B && id <= T.BOOT_FIRE) {
          t = T.FLOOR; ov = id;
        } else if (id === T.BLOCK) {
          t = T.FLOOR; blocks.push({ x, y });
        } else if (id === T.CHIP) {
          t = T.FLOOR; ov = T.CHIP; chipsNeeded++;
        } else if (id === T.TRAP) {
          t = T.TRAP; traps.push({ x, y, open: false });
        } else if (id === T.CLONER) {
          t = T.CLONER; cloners.push({ x, y, dir: DIR.E, template: "ball" });
        } else if (id === T.TELEPORT) {
          t = T.TELEPORT; teleporters.push({ x, y });
        } else {
          t = id;
        }
      } else if (MONSTER_CHARS[ch]) {
        t = T.FLOOR;
        const m = MONSTER_CHARS[ch];
        enemies.push({ x, y, dir: m.dir, type: m.type, timer: 0, step: 0 });
      } else if (ch === "A") {
        t = T.FLOOR; player.x = x; player.y = y; foundPlayer = true;
      }

      map[y][x] = t;
      overlay[y][x] = ov;
    }
  }
  if (!foundPlayer) {
    outer: for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (map[y][x] === T.FLOOR) { player.x = x; player.y = y; break outer; }
  }
  if (chipsNeeded === 0) chipsNeeded = 0;
}

function loadLevel(n) {
  customLevel = null; fromEditor = false; level = n;
  parseLevel(LEVELS[n]);
  player.dir = 0; player.frame = 0; player.moving = false;
  levelNumEl.textContent = n + 1;
  levelTotalEl.textContent = LEVELS.length;
  keyCountEl.textContent = chipsCollected + "/" + chipsNeeded;
  statusEl.textContent = "Swipe or D-pad";
  gameState = "play";
  hideAllScreens();
  backToEditorBtn.classList.add("hidden");
  backToEditorWinBtn.classList.add("hidden");
  document.body.classList.remove("editor-mode");
}

function loadCustomLevel(data, testing) {
  customLevel = data; fromEditor = !!testing;
  parseLevel(data.map);
  player.dir = 0; player.frame = 0; player.moving = false;
  levelNumEl.textContent = testing ? "Test" : "Custom";
  levelTotalEl.textContent = "1";
  keyCountEl.textContent = chipsCollected + "/" + chipsNeeded;
  statusEl.textContent = testing ? "Testing" : "Custom";
  gameState = "play";
  hideAllScreens();
  if (testing) {
    backToEditorBtn.classList.remove("hidden");
    backToEditorWinBtn.classList.remove("hidden");
  } else {
    backToEditorBtn.classList.add("hidden");
    backToEditorWinBtn.classList.add("hidden");
  }
  document.body.classList.remove("editor-mode");
}

function hideAllScreens() {
  [startScreen, levelComplete, gameOver, winScreen, exportModal, importModal]
    .forEach(el => el && el.classList.add("hidden"));
  if (editorBar) editorBar.classList.add("hidden");
}
function showScreen(el) { hideAllScreens(); el.classList.remove("hidden"); }

let lastTime = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (gameState === "play") {
    updateEnemies(dt);
    if (player.moving) {
      player.animTimer += dt;
      if (player.animTimer > 0.35) player.moving = false;
    }
  }
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", e => {
  if (gameState === "editor") {
    const k = e.key;
    if (ALL_CHARS.includes(k)) {
      selectedTile = k;
      document.querySelectorAll(".palette-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.ch === selectedTile);
      });
      statusEl.textContent = "Paint: " + (TILE_LABELS[k] || k);
    }
    return;
  }
  if (gameState !== "play") return;
  const k = e.key.toLowerCase();
  if (k === "arrowup" || k === "w") tryMove(0, -1);
  else if (k === "arrowdown" || k === "s") tryMove(0, 1);
  else if (k === "arrowleft" || k === "a") tryMove(-1, 0);
  else if (k === "arrowright" || k === "d") tryMove(1, 0);
  e.preventDefault();
});

document.querySelectorAll(".dpad-btn").forEach(btn => {
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    if (gameState !== "play") return;
    tryMove(parseInt(btn.dataset.dx, 10), parseInt(btn.dataset.dy, 10));
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 120);
  });
});

function onTouchStart(e) {
  if (gameState === "editor") {
    painting = true;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    paintAt(t.clientX, t.clientY);
    e.preventDefault(); return;
  }
  if (gameState !== "play") return;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  touchStartX = t.clientX; touchStartY = t.clientY; touchActive = true;
}
function onTouchMove(e) {
  if (gameState === "editor" && painting) {
    const t = e.changedTouches ? e.changedTouches[0] : e;
    paintAt(t.clientX, t.clientY); e.preventDefault();
  }
}
function onTouchEnd(e) {
  if (gameState === "editor") { painting = false; return; }
  if (!touchActive || gameState !== "play") return;
  touchActive = false;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 1 : -1, 0);
  else tryMove(0, dy > 0 ? 1 : -1);
}
canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
canvas.addEventListener("touchend", onTouchEnd, { passive: true });
canvas.addEventListener("mousedown", onTouchStart);
canvas.addEventListener("mousemove", e => { if (painting && gameState === "editor") paintAt(e.clientX, e.clientY); });
canvas.addEventListener("mouseup", onTouchEnd);
canvas.addEventListener("mouseleave", () => { painting = false; });

function on(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", e => {
    e.preventDefault();
    handler(e);
  });
}

on("startBtn", () => loadLevel(0));
on("nextBtn", () => loadLevel(level + 1));
on("retryBtn", () => {
  if (customLevel) loadCustomLevel(customLevel, fromEditor);
  else loadLevel(level);
});
on("restartBtn", () => {
  loadLevel(0);
});
on("editorBtn", () => enterEditor());
on("exitEditorBtn", () => {
  gameState = "start"; hideAllScreens();
  startScreen.classList.remove("hidden");
  document.body.classList.remove("editor-mode");
  statusEl.textContent = "Swipe or use D-pad";
  levelNumEl.textContent = "1"; levelTotalEl.textContent = String(LEVELS.length);
});
on("resizeBtn", () => {
  const cols = Math.max(5, Math.min(40, parseInt(document.getElementById("editCols").value, 10) || 20));
  const rows = Math.max(5, Math.min(30, parseInt(document.getElementById("editRows").value, 10) || 15));
  initEmptyMap(cols, rows);
  COLS = editCols; ROWS = editRows; resizeCanvas();
  statusEl.textContent = "Resized " + cols + "x" + rows;
});
on("clearMapBtn", () => {
  initEmptyMap(editCols, editRows);
  statusEl.textContent = "Cleared";
});
on("testLevelBtn", () => {
  loadCustomLevel(getLevelData(), true);
});
on("exportBtn", () => {
  document.getElementById("exportText").value = JSON.stringify(getLevelData(), null, 2);
  showScreen(exportModal);
});
on("closeExportBtn", () => {
  hideAllScreens(); editorBar.classList.remove("hidden");
});
on("copyExportBtn", async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById("exportText").value);
    statusEl.textContent = "Copied";
  } catch (e) { statusEl.textContent = "Copy failed"; }
});
on("downloadExportBtn", () => {
  const blob = new Blob([document.getElementById("exportText").value], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "level.json"; a.click();
});
on("importBtn", () => {
  document.getElementById("importText").value = ""; showScreen(importModal);
});
on("importStartBtn", () => {
  document.getElementById("importText").value = ""; showScreen(importModal);
});
on("closeImportBtn", () => {
  if (gameState === "editor") {
    hideAllScreens(); editorBar.classList.remove("hidden");
  } else {
    hideAllScreens(); startScreen.classList.remove("hidden");
  }
});

function parseImport(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return { name: "Imported", cols: data[0].length, rows: data.length, map: data, version: 3 };
  if (data && data.map) return data;
  throw new Error("Expected level JSON or map array");
}

document.getElementById("confirmImportBtn").addEventListener("click", () => {
  try {
    const data = parseImport(document.getElementById("importText").value);
    if (gameState === "editor" || document.body.classList.contains("editor-mode")) {
      editCols = data.cols; editRows = data.rows;
      editMap = data.map.slice();
      document.getElementById("editCols").value = editCols;
      document.getElementById("editRows").value = editRows;
      hideAllScreens(); editorBar.classList.remove("hidden");
      gameState = "editor"; document.body.classList.add("editor-mode");
      statusEl.textContent = "Imported";
    } else loadCustomLevel(data, false);
  } catch (err) {
    statusEl.textContent = "Import failed: " + (err.message || "bad");
  }
});
function returnToEditor() {
  if (customLevel) {
    editCols = customLevel.cols; editRows = customLevel.rows;
    editMap = customLevel.map.slice();
  }
  enterEditor();
}
backToEditorBtn.addEventListener("click", returnToEditor);
backToEditorWinBtn.addEventListener("click", returnToEditor);

document.getElementById("dpad").addEventListener("contextmenu", e => e.preventDefault());
canvas.addEventListener("contextmenu", e => e.preventDefault());

resizeCanvas();
loadAssets().then(() => {});
requestAnimationFrame(loop);
window.__JOEJUKE_READY__ = true;

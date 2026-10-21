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
var chipCountEl = document.getElementById("chipCount");
var chipsNeededDisplayEl = document.getElementById("chipsNeededDisplay");
var invDisplayEl = document.getElementById("invDisplay");
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

/** Refresh chips count and key/boot symbols in the HUD. */
function updateHud() {
  if (chipCountEl) chipCountEl.textContent = String(chipsCollected);
  if (chipsNeededDisplayEl) chipsNeededDisplayEl.textContent = String(chipsNeeded);
  if (!invDisplayEl) return;
  var parts = [];
  if (inv.keys.b > 0) parts.push('<span class="inv-icon key-b" title="Blue key">K' + (inv.keys.b > 1 ? '<span class="cnt">' + inv.keys.b + '</span>' : '') + '</span>');
  if (inv.keys.r > 0) parts.push('<span class="inv-icon key-r" title="Red key">K' + (inv.keys.r > 1 ? '<span class="cnt">' + inv.keys.r + '</span>' : '') + '</span>');
  if (inv.keys.g > 0) parts.push('<span class="inv-icon key-g" title="Green key">K' + (inv.keys.g > 1 ? '<span class="cnt">' + inv.keys.g + '</span>' : '') + '</span>');
  if (inv.keys.y > 0) parts.push('<span class="inv-icon key-y" title="Yellow key">K' + (inv.keys.y > 1 ? '<span class="cnt">' + inv.keys.y + '</span>' : '') + '</span>');
  if (inv.boots.flip) parts.push('<span class="inv-icon boot-flip" title="Flippers">F</span>');
  if (inv.boots.fire) parts.push('<span class="inv-icon boot-fire" title="Fire boots">B</span>');
  if (inv.boots.ice) parts.push('<span class="inv-icon boot-ice" title="Ice skates">I</span>');
  if (inv.boots.suction) parts.push('<span class="inv-icon boot-suction" title="Suction boots">S</span>');
  invDisplayEl.innerHTML = parts.join("");
}

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
        if ((id >= T.KEY_B && id <= T.KEY_Y) ||
            (id >= T.BOOT_FLIP && id <= T.BOOT_SUCTION) ||
            id === T.CHIP) {
          t = T.FLOOR; ov = id;
          if (id === T.CHIP) chipsNeeded++;
        } else if (id === T.BLOCK) {
          t = T.FLOOR; blocks.push({ x, y });
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
  cloners.forEach(cl => {
    let set = false;
    for (let d = 0; d < 4; d++) {
      const nx = cl.x + DX[d], ny = cl.y + DY[d];
      if (!inBounds(nx, ny)) continue;
      const t = map[ny][nx];
      if (typeof isForce === "function" && isForce(t)) {
        cl.dir = forceDirOf(t);
        set = true;
        break;
      }
    }
    if (!set) {
      for (let d = 0; d < 4; d++) {
        const nx = cl.x + DX[d], ny = cl.y + DY[d];
        if (inBounds(nx, ny) && map[ny][nx] !== T.WALL && map[ny][nx] !== T.INVIS) {
          cl.dir = d;
          break;
        }
      }
    }
  });
  if (chipsNeeded === 0) chipsNeeded = 0;
}

function loadLevel(n) {
  customLevel = null; fromEditor = false; level = n;
  parseLevel(LEVELS[n]);
  player.dir = 0; player.frame = 0; player.moving = false;
  levelNumEl.textContent = n + 1;
  levelTotalEl.textContent = LEVELS.length;
  updateHud();
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
  updateHud();
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
  if (!el) { console.warn("Missing element:", id); return; }
  el.addEventListener("click", e => {
    e.preventDefault();
    handler(e);
  });
}

on("startBtn", () => loadLevel(0));
on("nextBtn", () => loadLevel(level + 1));
on("retryBtn", () => {
  if (fromEditor && customLevel) loadCustomLevel(customLevel, true);
  else if (customLevel) loadCustomLevel(customLevel, false);
  else loadLevel(level);
});
on("restartBtn", () => {
  if (fromEditor && customLevel) { enterEditor(); return; }
  loadLevel(0);
});
on("editorBtn", () => enterEditor());
on("exitEditorBtn", () => {
  gameState = "start"; hideAllScreens();
  startScreen.classList.remove("hidden");
  document.body.classList.remove("editor-mode");
  statusEl.textContent = "Swipe or use D-pad";
  levelNumEl.textContent = "1"; levelTotalEl.textContent = String(LEVELS.length);
  COLS = 20; ROWS = 15; resizeCanvas();
});
on("resizeBtn", () => {
  let c = parseInt(document.getElementById("editCols").value, 10) || 20;
  let r = parseInt(document.getElementById("editRows").value, 10) || 15;
  c = Math.max(5, Math.min(40, c)); r = Math.max(5, Math.min(30, r));
  document.getElementById("editCols").value = c;
  document.getElementById("editRows").value = r;
  const old = editMap.slice(), oldC = editCols, oldR = editRows;
  editCols = c; editRows = r; editMap = [];
  for (let y = 0; y < r; y++) {
    let row = "";
    for (let x = 0; x < c; x++) {
      if (y < oldR && x < oldC && old[y]) row += old[y][x] || ".";
      else if (y === 0 || y === r - 1 || x === 0 || x === c - 1) row += "W";
      else row += ".";
    }
    editMap.push(row);
  }
  COLS = editCols; ROWS = editRows; resizeCanvas();
});
on("clearMapBtn", () => {
  editMap = [];
  for (let y = 0; y < editRows; y++) {
    let row = "";
    for (let x = 0; x < editCols; x++) {
      if (y === 0 || y === editRows - 1 || x === 0 || x === editCols - 1) row += "W";
      else row += ".";
    }
    editMap.push(row);
  }
  statusEl.textContent = "Cleared";
});
on("testLevelBtn", () => {
  const data = { name: "Test", cols: editCols, rows: editRows, map: editMap.slice(), version: 1 };
  loadCustomLevel(data, true);
});
on("exportBtn", () => {
  const data = { name: "Custom", cols: editCols, rows: editRows, map: editMap.slice(), version: 1 };
  document.getElementById("exportText").value = JSON.stringify(data, null, 2);
  hideAllScreens();
  exportModal.classList.remove("hidden");
});
on("importBtn", () => {
  hideAllScreens();
  importModal.classList.remove("hidden");
  document.getElementById("importText").value = "";
});
on("closeExportBtn", () => {
  if (document.body.classList.contains("editor-mode")) {
    hideAllScreens(); editorBar.classList.remove("hidden");
    gameState = "editor";
  } else {
    hideAllScreens(); startScreen.classList.remove("hidden");
  }
});
on("closeImportBtn", () => {
  if (document.body.classList.contains("editor-mode")) {
    hideAllScreens(); editorBar.classList.remove("hidden");
    gameState = "editor";
  } else {
    hideAllScreens(); startScreen.classList.remove("hidden");
  }
});
function parseImport(text) {
  text = text.trim();
  if (!text) throw new Error("Empty");
  try {
    const obj = JSON.parse(text);
    if (obj.map && Array.isArray(obj.map)) {
      const cols = obj.cols || obj.map[0].length;
      const rows = obj.rows || obj.map.length;
      return { name: obj.name || "Imported", cols, rows, map: obj.map.map(r => String(r).padEnd(cols, ".").slice(0, cols)), version: obj.version || 1 };
    }
    if (Array.isArray(obj)) {
      const cols = obj[0].length;
      return { name: "Imported", cols, rows: obj.length, map: obj.map(r => String(r).padEnd(cols, ".").slice(0, cols)), version: 1 };
    }
  } catch (_) {}
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) throw new Error("Bad format");
  const cols = Math.max(...lines.map(l => l.length));
  return { name: "Imported", cols, rows: lines.length, map: lines.map(r => r.padEnd(cols, ".").slice(0, cols)), version: 1 };
}
document.getElementById("confirmImportBtn").addEventListener("click", () => {
  try {
    const data = parseImport(document.getElementById("importText").value);
    if (document.body.classList.contains("editor-mode") || gameState === "editor") {
      editCols = data.cols; editRows = data.rows; editMap = data.map.slice();
      COLS = editCols; ROWS = editRows; resizeCanvas();
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
loadAssets().then(() => {
});
requestAnimationFrame(loop);
window.__JOEJUKE_READY__ = true;

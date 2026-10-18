/**
 * Joe's Juke — Puzzle game + Level Editor
 * Concept built around the wd17d.jpg pixel art sheet
 *
 * Tile interactions:
 *  - Ice (I): slide until you hit a non-ice solid
 *  - Dry block (B): pushable crates; sink into water to create a path
 *  - Water (~): impassable unless filled by a block
 *  - Spikes (S): lethal / blocked
 *  - Key (K) / Lock (L) / Exit (E)
 *  - Enemy (M): patrols
 *  - Player start (P)
 */

(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const TILE = 32;

  // Dynamic size (default matches original 20×15)
  let COLS = 20;
  let ROWS = 15;

  const levelNumEl = document.getElementById("levelNum");
  const levelTotalEl = document.getElementById("levelTotal");
  const keyCountEl = document.getElementById("keyCount");
  const statusEl = document.getElementById("status");

  const startScreen = document.getElementById("startScreen");
  const levelComplete = document.getElementById("levelComplete");
  const gameOver = document.getElementById("gameOver");
  const winScreen = document.getElementById("winScreen");
  const editorBar = document.getElementById("editorBar");
  const exportModal = document.getElementById("exportModal");
  const importModal = document.getElementById("importModal");
  const backToEditorBtn = document.getElementById("backToEditorBtn");
  const backToEditorWinBtn = document.getElementById("backToEditorWinBtn");

  let level = 0;
  let keysCollected = 0;
  let keysNeeded = 0;
  let player = { x: 1, y: 1, dir: 0, frame: 0, moving: false, animTimer: 0 };
  let enemies = [];
  let map = [];
  let gameState = "start";
  let customLevel = null;
  let fromEditor = false;

  let editMap = [];
  let editCols = 20;
  let editRows = 15;
  let selectedTile = "W";
  let painting = false;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  const SWIPE_THRESHOLD = 24;

  const WALL = 1, FLOOR = 2, WATER = 3, EXIT = 4, KEY = 5, LOCK = 6, SPIKE = 7, ICE = 8, BLOCK = 9;

  const TILE_CHARS = [".", "W", "~", "I", "B", "K", "L", "E", "S", "M", "P"];
  const TILE_LABELS = {
    ".": "Floor", "W": "Wall", "~": "Water", "I": "Ice", "B": "Block",
    "K": "Key", "L": "Lock", "E": "Exit", "S": "Spike", "M": "Enemy", "P": "Player"
  };

  const LEVELS = [
    ["WWWWWWWWWWWWWWWWWWWW","W........P.........W","W..................W","W....WWWW..........W","W..................W","W..........K.......W","W......B...........W","W....WWWW..........W","W..................W","W..................W","W.............E....W","W..................W","W..................W","W..................W","WWWWWWWWWWWWWWWWWWWW"],
    ["WWWWWWWWWWWWWWWWWWWW","W.P................W","W.WWWW.WWWW.WWWW...W","W......B...........W","W.K....L...........W","W.WWWW.WWWW.WWWW...W","W..................W","W......K.....B.....W","W.WWWW.WWWW.WWWW...W","W..................W","W.............L....W","W.WWWW.WWWW.WWWW.E.W","W..................W","W..................W","WWWWWWWWWWWWWWWWWWWW"],
    ["WWWWWWWWWWWWWWWWWWWW","W.P....~.~.~.......W","W.WWWW.WWWW.WWWW...W","W......M.....B.....W","W.K................W","W.WWWW.~.~.WWWW....W","W......B...........W","W......M.....K.....W","W.WWWW.WWWW.WWWW...W","W..................W","W.............L....W","W.~~~~.WWWW.~~~~.E.W","W..................W","W..................W","WWWWWWWWWWWWWWWWWWWW"],
    ["WWWWWWWWWWWWWWWWWWWW","W.P................W","W.IIII.IIII.IIII...W","W......S.....B.....W","W.K....S...........W","W.IIII.IIII.IIII...W","W......S.....M.....W","W......K...........W","W.IIII.IIII.IIII...W","W......S...........W","W.............L....W","W.IIII.IIII.IIII.E.W","W..................W","W..................W","WWWWWWWWWWWWWWWWWWWW"],
    ["WWWWWWWWWWWWWWWWWWWW","W.P..~..S..~..S....W","W.WW.WW.WW.WW.WW...W","W....M.....M...B...W","W.K..IIIIIIIIII....W","W.WW.WW.WW.WW.WW...W","W......M.....K.....W","W.~~~~.~~~~.~~~~...W","W.WW.WW.WW.WW.WW...W","W....S.....S...B...W","W.............L....W","W.IIII.M.IIII.M..E.W","W..................W","W..................W","WWWWWWWWWWWWWWWWWWWW"]
  ];

  function resizeCanvas() {
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;
  }

  function parseLevel(raw) {
    const rows = raw.length;
    const cols = raw[0] ? raw[0].length : 0;
    COLS = cols;
    ROWS = rows;
    resizeCanvas();
    map = [];
    enemies = [];
    keysNeeded = 0;
    keysCollected = 0;
    let foundPlayer = false;
    for (let y = 0; y < ROWS; y++) {
      map[y] = [];
      const row = raw[y] || "";
      for (let x = 0; x < COLS; x++) {
        const ch = row[x] || ".";
        let t = FLOOR;
        if (ch === "W") t = WALL;
        else if (ch === "~") t = WATER;
        else if (ch === "E") t = EXIT;
        else if (ch === "K") { t = KEY; keysNeeded++; }
        else if (ch === "L") t = LOCK;
        else if (ch === "S") t = SPIKE;
        else if (ch === "I") t = ICE;
        else if (ch === "B") t = BLOCK;
        else if (ch === "P") { t = FLOOR; player.x = x; player.y = y; foundPlayer = true; }
        else if (ch === "M") {
          t = FLOOR;
          enemies.push({ x, y, dir: Math.random() < 0.5 ? 1 : -1, axis: Math.random() < 0.5 ? "x" : "y", timer: 0 });
        }
        map[y][x] = t;
      }
    }
    if (!foundPlayer) {
      for (let y = 0; y < ROWS && !foundPlayer; y++) {
        for (let x = 0; x < COLS; x++) {
          if (map[y][x] === FLOOR) { player.x = x; player.y = y; foundPlayer = true; break; }
        }
      }
    }
  }

  function loadLevel(n) {
    customLevel = null;
    fromEditor = false;
    level = n;
    parseLevel(LEVELS[n]);
    player.dir = 0; player.frame = 0; player.moving = false;
    levelNumEl.textContent = n + 1;
    levelTotalEl.textContent = LEVELS.length;
    keyCountEl.textContent = keysCollected;
    statusEl.textContent = "Swipe or D-pad";
    gameState = "play";
    hideAllScreens();
    backToEditorBtn.classList.add("hidden");
    backToEditorWinBtn.classList.add("hidden");
    document.body.classList.remove("editor-mode");
  }

  function loadCustomLevel(data, testing) {
    customLevel = data;
    fromEditor = !!testing;
    parseLevel(data.map);
    player.dir = 0; player.frame = 0; player.moving = false;
    levelNumEl.textContent = testing ? "Test" : "Custom";
    levelTotalEl.textContent = "1";
    keyCountEl.textContent = keysCollected;
    statusEl.textContent = testing ? "Testing level" : "Custom level";
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

  function showScreen(el) {
    hideAllScreens();
    el.classList.remove("hidden");
  }

  function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }

  function canStand(x, y) {
    if (!inBounds(x, y)) return false;
    const t = map[y][x];
    if (t === WALL || t === WATER || t === SPIKE || t === BLOCK) return false;
    if (t === LOCK && keysCollected < keysNeeded) return false;
    return true;
  }

  function canPushBlockTo(x, y) {
    if (!inBounds(x, y)) return false;
    const t = map[y][x];
    return t === FLOOR || t === ICE || t === WATER;
  }

  function slideOnIce(startX, startY, dx, dy, isBlock) {
    let x = startX, y = startY;
    while (true) {
      const nx = x + dx, ny = y + dy;
      if (isBlock) {
        if (!canPushBlockTo(nx, ny)) break;
        if (map[ny][nx] !== ICE && map[ny][nx] !== FLOOR && map[ny][nx] !== WATER) break;
        if (map[ny][nx] !== ICE) { x = nx; y = ny; break; }
      } else {
        if (!canStand(nx, ny) || map[ny][nx] !== ICE) break;
      }
      x = nx; y = ny;
    }
    return { x, y };
  }

  function tryMove(dx, dy) {
    if (gameState !== "play") return;
    const nx = player.x + dx, ny = player.y + dy;
    if (!inBounds(nx, ny)) return;
    const target = map[ny][nx];
    if (target === BLOCK) {
      const bx = nx + dx, by = ny + dy;
      if (!canPushBlockTo(bx, by)) { statusEl.textContent = "Can't push!"; return; }
      map[ny][nx] = FLOOR;
      if (map[by][bx] === WATER) { map[by][bx] = FLOOR; statusEl.textContent = "Block filled water!"; }
      else if (map[by][bx] === ICE) {
        const final = slideOnIce(bx, by, dx, dy, true);
        if (map[final.y][final.x] === WATER) { map[final.y][final.x] = FLOOR; statusEl.textContent = "Block slid into water!"; }
        else { map[final.y][final.x] = BLOCK; statusEl.textContent = "Block slid!"; }
      } else { map[by][bx] = BLOCK; statusEl.textContent = "Pushed!"; }
      player.x = nx; player.y = ny;
    } else if (canStand(nx, ny)) {
      if (target === ICE) {
        const final = slideOnIce(nx, ny, dx, dy, false);
        player.x = final.x; player.y = final.y;
        statusEl.textContent = "Slide!";
      } else { player.x = nx; player.y = ny; }
    } else return;
    player.dir = dx > 0 ? 0 : dx < 0 ? 1 : dy > 0 ? 2 : 3;
    player.moving = true; player.animTimer = 0;
    const land = map[player.y][player.x];
    if (land === KEY) {
      map[player.y][player.x] = FLOOR; keysCollected++; keyCountEl.textContent = keysCollected;
      statusEl.textContent = keysCollected >= keysNeeded ? "All keys! → exit" : "Key!";
    }
    if (land === LOCK && keysCollected >= keysNeeded) { map[player.y][player.x] = FLOOR; statusEl.textContent = "Lock opened!"; }
    if (land === EXIT) {
      if (keysCollected >= keysNeeded) {
        if (customLevel || fromEditor) {
          gameState = "win"; showScreen(winScreen);
          winScreen.querySelector("p").textContent = fromEditor ? "Custom level cleared! Export it when ready." : "Custom level cleared!";
        } else if (level >= LEVELS.length - 1) {
          gameState = "win"; showScreen(winScreen);
          winScreen.querySelector("p").textContent = "Joe juked through all 5 levels.";
        } else { gameState = "levelDone"; showScreen(levelComplete); }
      } else statusEl.textContent = "Need more keys!";
    }
    if (map[player.y][player.x] === SPIKE) { gameState = "dead"; showScreen(gameOver); }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      e.timer += dt;
      if (e.timer < 0.4) continue;
      e.timer = 0;
      let nx = e.x, ny = e.y;
      if (e.axis === "x") nx += e.dir; else ny += e.dir;
      if (!canStand(nx, ny) || map[ny][nx] === EXIT || map[ny][nx] === KEY || map[ny][nx] === BLOCK) {
        e.dir *= -1;
        if (e.axis === "x") nx = e.x + e.dir; else ny = e.y + e.dir;
      }
      if (canStand(nx, ny) && map[ny][nx] !== BLOCK) { e.x = nx; e.y = ny; }
      if (e.x === player.x && e.y === player.y) { gameState = "dead"; showScreen(gameOver); }
    }
  }

  function drawJoe(px, py, dir, frame) {
    const bob = player.moving ? Math.sin(frame * 12) * 1.5 : 0;
    ctx.fillStyle = "#2c3e50";
    if (player.moving) { ctx.fillRect(px + 8, py + 22 + bob, 6, 8); ctx.fillRect(px + 18, py + 22 - bob, 6, 8); }
    else { ctx.fillRect(px + 9, py + 22, 6, 8); ctx.fillRect(px + 17, py + 22, 6, 8); }
    ctx.fillStyle = "#3498db"; ctx.fillRect(px + 7, py + 10 + bob, 18, 14);
    ctx.fillStyle = "#f5cba7"; ctx.beginPath(); ctx.arc(px + 16, py + 7 + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(px + 12, py + 5 + bob, 2, 2); ctx.fillRect(px + 18, py + 5 + bob, 2, 2);
    ctx.fillStyle = "#e74c3c";
    if (dir === 0) ctx.fillRect(px + 22, py + 14 + bob, 4, 2);
    else if (dir === 1) ctx.fillRect(px + 6, py + 14 + bob, 4, 2);
    else if (dir === 2) ctx.fillRect(px + 15, py + 20 + bob, 2, 4);
    else ctx.fillRect(px + 15, py + 4 + bob, 2, 4);
  }

  function drawBlock(px, py) {
    ctx.fillStyle = "#8B5A2B"; ctx.fillRect(px + 3, py + 3, 26, 26);
    ctx.fillStyle = "#A0522D"; ctx.fillRect(px + 5, py + 5, 22, 22);
    ctx.strokeStyle = "#5D3A1A"; ctx.lineWidth = 2; ctx.strokeRect(px + 5, py + 5, 22, 22);
    ctx.beginPath(); ctx.moveTo(px + 5, py + 16); ctx.lineTo(px + 27, py + 16); ctx.moveTo(px + 16, py + 5); ctx.lineTo(px + 16, py + 27); ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawMapTiles(useEditMap) {
    const src = useEditMap ? editMap : null;
    const rows = useEditMap ? editRows : ROWS;
    const cols = useEditMap ? editCols : COLS;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let t;
        if (useEditMap) {
          const ch = (src[y] && src[y][x]) || ".";
          if (ch === "W") t = WALL; else if (ch === "~") t = WATER; else if (ch === "E") t = EXIT;
          else if (ch === "K") t = KEY; else if (ch === "L") t = LOCK; else if (ch === "S") t = SPIKE;
          else if (ch === "I") t = ICE; else if (ch === "B") t = BLOCK; else t = FLOOR;
        } else t = map[y][x];
        const px = x * TILE, py = y * TILE;
        ctx.fillStyle = "#1e1e2e"; ctx.fillRect(px, py, TILE, TILE);
        if (t === WALL) {
          ctx.fillStyle = "#3d3d5c"; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.strokeStyle = "#2a2a3a"; ctx.beginPath(); ctx.moveTo(px, py + 16); ctx.lineTo(px + 32, py + 16); ctx.stroke();
        } else if (t === WATER) {
          ctx.fillStyle = "#1a5a8a"; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "rgba(100,180,255,0.35)"; ctx.fillRect(px + 4, py + 8, 8, 4); ctx.fillRect(px + 16, py + 18, 10, 3);
        } else if (t === EXIT) {
          ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 4, py + 4, 24, 24);
          ctx.fillStyle = "#2ecc71"; ctx.fillRect(px + 8, py + 8, 16, 16);
          ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.fillText("E", px + 11, py + 20);
        } else if (t === KEY) {
          ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(px + 16, py + 13, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(px + 14, py + 17, 4, 8); ctx.fillRect(px + 14, py + 23, 8, 3);
        } else if (t === LOCK) {
          ctx.fillStyle = "#c0392b"; ctx.fillRect(px + 6, py + 6, 20, 20);
          ctx.fillStyle = "#e74c3c"; ctx.fillRect(px + 10, py + 10, 12, 12);
          ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif"; ctx.fillText("L", px + 11, py + 20);
        } else if (t === SPIKE) {
          ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.moveTo(px + 16, py + 4); ctx.lineTo(px + 28, py + 28); ctx.lineTo(px + 4, py + 28); ctx.closePath(); ctx.fill();
        } else if (t === ICE) {
          ctx.fillStyle = "#a0d8ef"; ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.strokeRect(px + 3, py + 3, 26, 26);
          ctx.beginPath(); ctx.moveTo(px + 8, py + 10); ctx.lineTo(px + 14, py + 18); ctx.lineTo(px + 22, py + 12); ctx.stroke();
        } else if (t === BLOCK) {
          if ((x + y) % 2 === 0) { ctx.fillStyle = "#252535"; ctx.fillRect(px, py, TILE, TILE); }
          drawBlock(px, py);
        } else if ((x + y) % 2 === 0) { ctx.fillStyle = "#252535"; ctx.fillRect(px, py, TILE, TILE); }
        if (useEditMap) {
          const ch = (src[y] && src[y][x]) || ".";
          if (ch === "P") drawJoe(px, py, 0, 0);
          else if (ch === "M") {
            ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.ellipse(px + 16, py + 18, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px + 11, py + 14, 3.5, 0, Math.PI * 2); ctx.arc(px + 21, py + 14, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(px + 11, py + 14, 1.5, 0, Math.PI * 2); ctx.arc(px + 21, py + 14, 1.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === "editor") {
      if (!editMap.length) { ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
      drawMapTiles(true); return;
    }
    if (!map.length) { ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
    drawMapTiles(false);
    for (const e of enemies) {
      const px = e.x * TILE, py = e.y * TILE;
      ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.ellipse(px + 16, py + 18, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px + 11, py + 14, 3.5, 0, Math.PI * 2); ctx.arc(px + 21, py + 14, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(px + 11, py + 14, 1.5, 0, Math.PI * 2); ctx.arc(px + 21, py + 14, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    drawJoe(player.x * TILE, player.y * TILE, player.dir, player.animTimer);
  }

  function initEmptyMap(cols, rows) {
    editCols = cols; editRows = rows; editMap = [];
    for (let y = 0; y < rows; y++) {
      let row = "";
      for (let x = 0; x < cols; x++) row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "W" : ".";
      editMap.push(row);
    }
    setEditChar(1, 1, "P");
    setEditChar(cols - 2, rows - 2, "E");
  }

  function setEditChar(x, y, ch) {
    if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
    if (ch === "P" || ch === "E") {
      for (let yy = 0; yy < editRows; yy++) {
        for (let xx = 0; xx < editCols; xx++) {
          if (editMap[yy][xx] === ch) editMap[yy] = editMap[yy].substring(0, xx) + "." + editMap[yy].substring(xx + 1);
        }
      }
    }
    editMap[y] = editMap[y].substring(0, x) + ch + editMap[y].substring(x + 1);
  }

  function buildPalette() {
    const palette = document.getElementById("palette");
    palette.innerHTML = "";
    TILE_CHARS.forEach(ch => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-btn" + (ch === selectedTile ? " active" : "");
      btn.dataset.ch = ch;
      btn.title = TILE_LABELS[ch] || ch;
      btn.textContent = ch === "." ? "·" : ch;
      btn.addEventListener("click", () => {
        selectedTile = ch;
        palette.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        statusEl.textContent = "Paint: " + (TILE_LABELS[ch] || ch);
      });
      palette.appendChild(btn);
    });
  }

  function enterEditor() {
    if (!editMap.length) initEmptyMap(20, 15);
    COLS = editCols; ROWS = editRows; resizeCanvas();
    document.getElementById("editCols").value = editCols;
    document.getElementById("editRows").value = editRows;
    buildPalette();
    gameState = "editor";
    hideAllScreens();
    editorBar.classList.remove("hidden");
    document.body.classList.add("editor-mode");
    statusEl.textContent = "Editor — paint tiles";
    levelNumEl.textContent = "Edit";
    levelTotalEl.textContent = "—";
  }

  function canvasToTile(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor(((clientX - rect.left) * scaleX) / TILE),
      y: Math.floor(((clientY - rect.top) * scaleY) / TILE)
    };
  }

  function paintAt(clientX, clientY) {
    if (gameState !== "editor") return;
    const { x, y } = canvasToTile(clientX, clientY);
    if (x < 0 || y < 0 || x >= editCols || y >= editRows) return;
    setEditChar(x, y, selectedTile);
  }

  function getLevelData() {
    return { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 1 };
  }

  function exportLevel() {
    document.getElementById("exportText").value = JSON.stringify(getLevelData(), null, 2);
    showScreen(exportModal);
  }

  function parseImport(text) {
    text = text.trim();
    if (!text) throw new Error("Empty input");
    try {
      const obj = JSON.parse(text);
      if (obj.map && Array.isArray(obj.map)) {
        const cols = obj.cols || (obj.map[0] ? obj.map[0].length : 20);
        const rows = obj.rows || obj.map.length;
        return { name: obj.name || "Imported Level", cols, rows, map: obj.map.map(r => String(r).padEnd(cols, ".").slice(0, cols)), version: obj.version || 1 };
      }
      if (Array.isArray(obj) && typeof obj[0] === "string") {
        const cols = obj[0].length;
        return { name: "Imported Level", cols, rows: obj.length, map: obj.map(r => String(r).padEnd(cols, ".").slice(0, cols)), version: 1 };
      }
    } catch (_) {}
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
    if (lines.length < 3) throw new Error("Need at least a few map rows");
    const cols = Math.max(...lines.map(l => l.length));
    return { name: "Imported Level", cols, rows: lines.length, map: lines.map(r => r.padEnd(cols, ".").slice(0, cols)), version: 1 };
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (gameState === "play") {
      updateEnemies(dt);
      if (player.moving) { player.animTimer += dt; if (player.animTimer > 0.35) player.moving = false; }
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", e => {
    if (gameState === "editor") {
      const k = e.key;
      if (TILE_CHARS.includes(k.toUpperCase()) || k === ".") {
        selectedTile = k === "." ? "." : k.toUpperCase();
        document.querySelectorAll(".palette-btn").forEach(b => b.classList.toggle("active", b.dataset.ch === selectedTile));
        statusEl.textContent = "Paint: " + (TILE_LABELS[selectedTile] || selectedTile);
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
      e.preventDefault();
      return;
    }
    if (gameState !== "play") return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    touchStartX = t.clientX; touchStartY = t.clientY; touchActive = true;
  }
  function onTouchMove(e) {
    if (gameState === "editor" && painting) {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      paintAt(t.clientX, t.clientY);
      e.preventDefault();
    }
  }
  function onTouchEnd(e) {
    if (gameState === "editor") { painting = false; return; }
    if (!touchActive || gameState !== "play") return;
    touchActive = false;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return;
    if (absX > absY) tryMove(dx > 0 ? 1 : -1, 0);
    else tryMove(0, dy > 0 ? 1 : -1);
  }

  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("mousedown", onTouchStart);
  canvas.addEventListener("mousemove", e => { if (painting && gameState === "editor") paintAt(e.clientX, e.clientY); });
  canvas.addEventListener("mouseup", onTouchEnd);
  canvas.addEventListener("mouseleave", () => { painting = false; });

  document.getElementById("startBtn").addEventListener("click", () => loadLevel(0));
  document.getElementById("nextBtn").addEventListener("click", () => loadLevel(level + 1));
  document.getElementById("retryBtn").addEventListener("click", () => {
    if (fromEditor && customLevel) loadCustomLevel(customLevel, true);
    else if (customLevel) loadCustomLevel(customLevel, false);
    else loadLevel(level);
  });
  document.getElementById("restartBtn").addEventListener("click", () => {
    if (fromEditor && customLevel) { enterEditor(); return; }
    loadLevel(0);
  });

  document.getElementById("editorBtn").addEventListener("click", () => enterEditor());
  document.getElementById("exitEditorBtn").addEventListener("click", () => {
    gameState = "start";
    hideAllScreens();
    startScreen.classList.remove("hidden");
    document.body.classList.remove("editor-mode");
    statusEl.textContent = "Swipe or use D-pad";
    levelNumEl.textContent = "1";
    levelTotalEl.textContent = "5";
    COLS = 20; ROWS = 15; resizeCanvas();
  });

  document.getElementById("resizeBtn").addEventListener("click", () => {
    let c = parseInt(document.getElementById("editCols").value, 10) || 20;
    let r = parseInt(document.getElementById("editRows").value, 10) || 15;
    c = Math.max(5, Math.min(40, c));
    r = Math.max(5, Math.min(30, r));
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
    statusEl.textContent = "Size " + c + "×" + r;
  });

  document.getElementById("clearMapBtn").addEventListener("click", () => {
    initEmptyMap(editCols, editRows);
    statusEl.textContent = "Map cleared";
  });

  document.getElementById("testLevelBtn").addEventListener("click", () => {
    if (!editMap.some(row => row.includes("P"))) { statusEl.textContent = "Place a Player (P) first!"; return; }
    if (!editMap.some(row => row.includes("E"))) { statusEl.textContent = "Place an Exit (E) first!"; return; }
    loadCustomLevel(getLevelData(), true);
  });

  document.getElementById("exportBtn").addEventListener("click", exportLevel);
  document.getElementById("closeExportBtn").addEventListener("click", () => {
    hideAllScreens();
    editorBar.classList.remove("hidden");
    gameState = "editor";
    document.body.classList.add("editor-mode");
  });
  document.getElementById("copyExportBtn").addEventListener("click", async () => {
    const text = document.getElementById("exportText").value;
    try { await navigator.clipboard.writeText(text); statusEl.textContent = "Copied to clipboard!"; }
    catch { document.getElementById("exportText").select(); document.execCommand("copy"); statusEl.textContent = "Copied!"; }
  });
  document.getElementById("downloadExportBtn").addEventListener("click", () => {
    const blob = new Blob([document.getElementById("exportText").value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "joejuke-level.json"; a.click();
    URL.revokeObjectURL(url);
    statusEl.textContent = "Download started";
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importText").value = "";
    showScreen(importModal);
  });
  document.getElementById("importStartBtn").addEventListener("click", () => {
    document.getElementById("importText").value = "";
    showScreen(importModal);
  });
  document.getElementById("closeImportBtn").addEventListener("click", () => {
    if (gameState === "editor" || document.body.classList.contains("editor-mode")) {
      hideAllScreens();
      editorBar.classList.remove("hidden");
      gameState = "editor";
      document.body.classList.add("editor-mode");
    } else {
      hideAllScreens();
      startScreen.classList.remove("hidden");
    }
  });
  document.getElementById("confirmImportBtn").addEventListener("click", () => {
    try {
      const data = parseImport(document.getElementById("importText").value);
      if (gameState === "editor" || document.body.classList.contains("editor-mode")) {
        editCols = data.cols; editRows = data.rows; editMap = data.map.slice();
        COLS = editCols; ROWS = editRows; resizeCanvas();
        document.getElementById("editCols").value = editCols;
        document.getElementById("editRows").value = editRows;
        hideAllScreens();
        editorBar.classList.remove("hidden");
        gameState = "editor";
        document.body.classList.add("editor-mode");
        statusEl.textContent = "Imported into editor";
      } else loadCustomLevel(data, false);
    } catch (err) {
      statusEl.textContent = "Import failed: " + (err.message || "bad format");
    }
  });

  function returnToEditor() {
    if (customLevel) {
      editCols = customLevel.cols;
      editRows = customLevel.rows;
      editMap = customLevel.map.slice();
    }
    enterEditor();
  }
  backToEditorBtn.addEventListener("click", returnToEditor);
  backToEditorWinBtn.addEventListener("click", returnToEditor);

  document.getElementById("dpad").addEventListener("contextmenu", e => e.preventDefault());
  canvas.addEventListener("contextmenu", e => e.preventDefault());

  resizeCanvas();
  requestAnimationFrame(loop);
})();

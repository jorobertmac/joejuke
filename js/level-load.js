/**
 * Joe's Juke — level parse/load, canvas size, camera
 * Supports layered levels: base terrain (always filled), item overlay (sparse),
 * and blocks (can sit on top of items so chips hide under blocks).
 */
"use strict";

function resizeCanvas() {
  var inEditor = (gameState === "editor") ||
    (document.body && document.body.classList.contains("editor-mode"));
  if (inEditor) {
    // Fixed footprint: resolution = visible tile viewport (editViewSize²)
    var vs = (typeof editViewSize === "number" && editViewSize > 0) ? editViewSize : 32;
    canvas.width = Math.max(1, vs) * TILE;
    canvas.height = Math.max(1, vs) * TILE;
  } else {
    canvas.width = ((typeof VIEW_COLS === "number") ? VIEW_COLS : 9) * TILE;
    canvas.height = ((typeof VIEW_ROWS === "number") ? VIEW_ROWS : 9) * TILE;
  }
}

function getCamera() {
  var vc = (typeof VIEW_COLS === "number") ? VIEW_COLS : 9;
  var vr = (typeof VIEW_ROWS === "number") ? VIEW_ROWS : 9;
  var halfW = Math.floor((vc - 1) / 2);
  var halfH = Math.floor((vr - 1) / 2);
  var px = (player && typeof player.x === "number") ? player.x : 0;
  var py = (player && typeof player.y === "number") ? player.y : 0;
  var camX = px - halfW;
  var camY = py - halfH;
  if (COLS <= vc) camX = Math.floor((COLS - vc) / 2);
  else camX = Math.max(0, Math.min(COLS - vc, camX));
  if (ROWS <= vr) camY = Math.floor((ROWS - vr) / 2);
  else camY = Math.max(0, Math.min(ROWS - vr, camY));
  return { camX: camX, camY: camY };
}

/**
 * Normalize level input to { mapRows, overlayRows, extraBlocks }.
 * Accepts:
 *  - string[] (legacy single-layer char maps)
 *  - { map: string[], overlay?: string[], blocks?: [{x,y}] }
 */
function normalizeLevelInput(raw) {
  if (!raw) return { mapRows: [], overlayRows: null, extraBlocks: null };
  if (Array.isArray(raw)) {
    return { mapRows: raw, overlayRows: null, extraBlocks: null };
  }
  if (typeof raw === "object") {
    var mapRows = raw.map || raw.rows || [];
    if (!Array.isArray(mapRows)) mapRows = [];
    var overlayRows = raw.overlay || null;
    if (overlayRows && !Array.isArray(overlayRows)) overlayRows = null;
    var extraBlocks = raw.blocks || null;
    if (extraBlocks && !Array.isArray(extraBlocks)) extraBlocks = null;
    return { mapRows: mapRows, overlayRows: overlayRows, extraBlocks: extraBlocks };
  }
  return { mapRows: [], overlayRows: null, extraBlocks: null };
}

function parseLevel(raw) {
  var norm = normalizeLevelInput(raw);
  var mapRows = norm.mapRows;
  var overlayRows = norm.overlayRows;
  var extraBlocks = norm.extraBlocks;

  // Migrate legacy single-char rows → packed 2-char IDs
  var migrated = [];
  for (var mi = 0; mi < mapRows.length; mi++) {
    migrated.push(typeof migrateLegacyRow === "function" ? migrateLegacyRow(mapRows[mi] || "") : (mapRows[mi] || ""));
  }
  mapRows = migrated;
  if (overlayRows) {
    var mov = [];
    for (var oi = 0; oi < overlayRows.length; oi++) {
      var orow = overlayRows[oi] || "";
      // Overlay empty is space; migrate if legacy
      if (orow.length && orow.length % 2 !== 0) {
        mov.push(typeof migrateLegacyRow === "function" ? migrateLegacyRow(orow) : orow);
      } else {
        mov.push(orow);
      }
    }
    overlayRows = mov;
  }

  const rows = mapRows.length;
  const cols = mapRows[0] ? rowCols(mapRows[0]) : 0;
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
    const row = mapRows[y] || "";
    const ovRow = (overlayRows && overlayRows[y]) ? overlayRows[y] : null;
    for (let x = 0; x < COLS; x++) {
      const ch = cellId(row, x, FLOOR_ID);
      let t = T.FLOOR, ov = null;

      // Explicit overlay layer takes priority for items when provided
      if (ovRow) {
        const och = cellId(ovRow, x, EMPTY_ID);
        if (och !== EMPTY_ID && och !== FLOOR_ID && CH[och] !== undefined) {
          const oid = CH[och];
          if ((oid >= T.KEY_B && oid <= T.KEY_Y) ||
              (oid >= T.BOOT_FLIP && oid <= T.BOOT_SUCTION) ||
              oid === T.CHIP) {
            ov = oid;
            if (oid === T.CHIP) chipsNeeded++;
          }
        }
      }

      if (CH[ch] !== undefined) {
        const id = CH[ch];
        if ((id >= T.KEY_B && id <= T.KEY_Y) ||
            (id >= T.BOOT_FLIP && id <= T.BOOT_SUCTION) ||
            id === T.CHIP) {
          // Item on base string: only use if no explicit overlay already set
          t = T.FLOOR;
          if (ov == null) {
            ov = id;
            if (id === T.CHIP) chipsNeeded++;
          }
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
      } else if (ch === PLAYER_ID || ch === "J0") {
        t = T.FLOOR; player.x = x; player.y = y; foundPlayer = true;
      }

      map[y][x] = t;
      overlay[y][x] = ov;
    }
  }

  // Extra block positions from structured level (may stack on overlay items)
  if (extraBlocks) {
    for (let i = 0; i < extraBlocks.length; i++) {
      const b = extraBlocks[i];
      if (!b || typeof b.x !== "number" || typeof b.y !== "number") continue;
      if (!inBounds(b.x, b.y)) continue;
      if (!blocks.some(function (ex) { return ex.x === b.x && ex.y === b.y; })) {
        blocks.push({ x: b.x, y: b.y });
      }
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


/** Apply pack metadata (title, time, moves, chips override) from a level object. */
function applyLevelMeta(raw) {
  levelTitle = "";
  levelTimeLimit = 0;
  levelTimeLeft = 0;
  levelMaxMoves = 0;
  moveCount = 0;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    if (typeof updateHud === "function") updateHud();
    return;
  }
  levelTitle = raw.title || raw.name || "";
  if (typeof raw.timeLimit === "number" && raw.timeLimit > 0) {
    levelTimeLimit = raw.timeLimit;
    levelTimeLeft = raw.timeLimit;
  }
  if (typeof raw.maxMoves === "number" && raw.maxMoves > 0) {
    levelMaxMoves = raw.maxMoves;
  }
  if (raw.chipsRequired != null && typeof raw.chipsRequired === "number" && raw.chipsRequired >= 0) {
    chipsNeeded = raw.chipsRequired;
  }
  if (typeof updateHud === "function") updateHud();
}

function loadLevel(n) {
  customLevel = null; fromEditor = false; level = n;
  parseLevel(LEVELS[n]);
  applyLevelMeta(LEVELS[n]);
  player.dir = 0; player.frame = 0; player.moving = false;
  player.sliding = false; player.slideQueue = []; player.slideTimer = 0;
  player.fromX = player.x; player.fromY = player.y;
  levelNumEl.textContent = n + 1;
  levelTotalEl.textContent = LEVELS.length;
  updateHud();
  statusEl.textContent = "Swipe or D-pad";
  gameState = "play";
  resizeCanvas();
  hideAllScreens();
  backToEditorBtn.classList.add("hidden");
  backToEditorWinBtn.classList.add("hidden");
  document.body.classList.remove("editor-mode");
  if (typeof applyEditZoom === "function") applyEditZoom();
  if (typeof setPauseBtnVisible === "function") setPauseBtnVisible(true);
}

function loadCustomLevel(data, testing) {
  customLevel = data; fromEditor = !!testing;
  // Pass full object so overlay + blocks layers are applied
  parseLevel(data);
  applyLevelMeta(data);
  player.dir = 0; player.frame = 0; player.moving = false;
  player.sliding = false; player.slideQueue = []; player.slideTimer = 0;
  player.fromX = player.x; player.fromY = player.y;
  levelNumEl.textContent = testing ? "Test" : "Custom";
  levelTotalEl.textContent = "1";
  updateHud();
  statusEl.textContent = testing ? "Testing" : "Custom";
  gameState = "play";
  resizeCanvas();
  hideAllScreens();
  if (testing) {
    backToEditorBtn.classList.remove("hidden");
    backToEditorWinBtn.classList.remove("hidden");
  } else {
    backToEditorBtn.classList.add("hidden");
    backToEditorWinBtn.classList.add("hidden");
  }
  document.body.classList.remove("editor-mode");
  if (typeof applyEditZoom === "function") applyEditZoom();
  if (typeof setPauseBtnVisible === "function") setPauseBtnVisible(true);
}

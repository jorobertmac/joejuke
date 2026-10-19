/**
 * Joe's Juke — Full Chip's Challenge–style puzzle + Level Editor
 * Reference: https://wiki.bitbusters.club/Tile (CC1 tile set)
 *
 * Full CC1 tile coverage (Lynx/MS behaviours where practical):
 * Floor, Wall, Water, Fire, Ice + 4 corners, Force N/E/S/W + Random,
 * Dirt, Gravel, Exit, Socket, Chip, Hint,
 * Invisible / Hidden / Recessed / Blue (real+fake) walls,
 * Thin walls N/E/S/W, Teleporter, Bomb, Thief, Trap,
 * Toggle wall/floor, Cloner, 4 buttons (G/R/B/Brn),
 * 4 keys + 4 locks, 4 boots, Block,
 * and all 9 monsters with correct turn preferences:
 * Ball, Glider, Fireball, Bug, Paramecium, Tank, Walker, Teeth, Blob.
 *
 * Visuals: pixel-art sprite sheets from resources/ (with procedural fallback).
 * Terrain strip, items strip, Joe sheet, monster sheets.
 */

(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const TILE = 32;

  // --- Asset loading (resources/) ---
  const assets = {
    ready: false,
    terrain: null,   // horizontal strip, 37 × 32
    items: null,     // horizontal strip, 18 × 32
    joe: null,       // 64×128 — cols=idle/walk, rows=N/E/S/W
    block: null,
    monsters: {},    // type → Image (sheet)
  };

  // Terrain strip indices (resources/README.md)
  const TERRAIN_IDX = {
    [0]: 0,   // FLOOR
    // floor_alt = 1 (checker use optional)
    [1]: 2,   // WALL
    [2]: 3,   // WATER
    [3]: 4,   // FIRE
    [4]: 5,   // ICE
    [5]: 6,   // ICE_NW
    [6]: 7,   // ICE_NE
    [7]: 8,   // ICE_SW
    [8]: 9,   // ICE_SE
    [9]: 10,  // FORCE_N
    [10]: 11, // FORCE_E
    [11]: 12, // FORCE_S
    [12]: 13, // FORCE_W
    [13]: 14, // FORCE_R
    [14]: 15, // DIRT
    [15]: 16, // GRAVEL
    [16]: 17, // EXIT
    [17]: 18, // SOCKET
    // CHIP is overlay
    [19]: 19, // HINT
    [20]: 20, // INVIS
    [21]: 21, // HIDDEN
    [22]: 22, // RECESSED
    [23]: 23, // BLUE_REAL
    [24]: 24, // BLUE_FAKE
    [25]: 25, // THIN_N
    [26]: 26, // THIN_E
    [27]: 27, // THIN_S
    [28]: 28, // THIN_W
    [29]: 29, // TELEPORT
    [30]: 30, // BOMB
    [31]: 31, // THIEF
    [32]: 32, // TRAP (closed default; open uses 33)
    [33]: 34, // TOGGLE_WALL
    [34]: 35, // TOGGLE_FLOOR
    [35]: 36, // CLONER
  };

  // Items strip indices
  const ITEM_IDX = {
    [18]: 0,  // CHIP
    [40]: 1,  // KEY_B
    [41]: 2,  // KEY_R
    [42]: 3,  // KEY_G
    [43]: 4,  // KEY_Y
    [48]: 5,  // BOOT_FLIP
    [49]: 6,  // BOOT_FIRE
    [50]: 7,  // BOOT_ICE
    [51]: 8,  // BOOT_SUCTION
    [44]: 10, // LOCK_B
    [45]: 11, // LOCK_R
    [46]: 12, // LOCK_G
    [47]: 13, // LOCK_Y
    [36]: 14, // BTN_GREEN
    [37]: 15, // BTN_RED
    [38]: 16, // BTN_BLUE
    [39]: 17, // BTN_BROWN
  };

  const MONSTER_TYPES = ["ball", "glider", "fireball", "bug", "paramecium", "tank", "walker", "teeth", "blob"];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load " + src));
      img.src = src;
    });
  }

  async function loadAssets() {
    try {
      const base = "resources/";
      const [terrain, items, joe, block, ...mons] = await Promise.all([
        loadImage(base + "tiles/terrain.png"),
        loadImage(base + "tiles/items.png"),
        loadImage(base + "sprites/joe.png"),
        loadImage(base + "tiles/item_block.png"),
        ...MONSTER_TYPES.map(t => loadImage(base + "monsters/" + t + ".png")),
      ]);
      assets.terrain = terrain;
      assets.items = items;
      assets.joe = joe;
      assets.block = block;
      MONSTER_TYPES.forEach((t, i) => { assets.monsters[t] = mons[i]; });
      assets.ready = true;
      console.log("Joe's Juke assets loaded");
    } catch (err) {
      console.warn("Asset load failed, using procedural fallback:", err);
      assets.ready = false;
    }
  }

  function drawSheetFrame(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!img) return false;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw || sw, dh || sh);
    return true;
  }

  function drawTerrainSprite(t, px, py) {
    if (!assets.ready || !assets.terrain) return false;
    // floor always draws base first for translucent overlays
    if (t === 0) {
      const checker = ((px / TILE) + (py / TILE)) % 2 === 0;
      const idx = checker ? 0 : 1;
      return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
    }
    // trap open/closed
    if (t === 32) {
      const tr = traps.find(tr => tr.x === px / TILE && tr.y === py / TILE);
      const idx = (tr && tr.open) ? 33 : 32;
      drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py); // floor under
      return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
    }
    // toggle wall/floor depend on state
    if (t === 33) {
      const idx = toggleOpen ? 35 : 34; // open → floor look, closed → wall
      return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
    }
    if (t === 34) {
      const idx = toggleOpen ? 34 : 35;
      return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
    }
    // chips, keys, boots, locks, buttons live on items strip
    if (ITEM_IDX[t] !== undefined) {
      drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py);
      return drawSheetFrame(assets.items, ITEM_IDX[t] * TILE, 0, TILE, TILE, px, py);
    }
    const idx = TERRAIN_IDX[t];
    if (idx === undefined) return false;
    // thin walls / invis / hidden sit on floor
    if (t === 20 || t === 21 || (t >= 25 && t <= 28)) {
      drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py);
      if (t === 20 || t === 21) return true; // look like floor
    }
    return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
  }

  function drawItemSprite(ov, px, py) {
    if (!assets.ready || !assets.items || ov == null) return false;
    const idx = ITEM_IDX[ov];
    if (idx === undefined) return false;
    return drawSheetFrame(assets.items, idx * TILE, 0, TILE, TILE, px, py);
  }

  function drawJoeSprite(px, py, dir, frame) {
    if (!assets.ready || !assets.joe) return false;
    // cols: 0=idle, 1=walk; rows: 0=N, 1=E, 2=S, 3=W
    const col = (player.moving || frame > 0.05) ? 1 : 0;
    const row = dir & 3;
    return drawSheetFrame(assets.joe, col * TILE, row * TILE, TILE, TILE, px, py);
  }

  function drawMonsterSprite(e, px, py) {
    if (!assets.ready) return false;
    const img = assets.monsters[e.type];
    if (!img) return false;
    const row = e.dir & 3;
    // blob has 2 frames
    let col = 0;
    if (e.type === "blob") {
      col = (Math.floor((performance.now() / 200) % 2));
    }
    const fw = TILE; // frame width
    return drawSheetFrame(img, col * fw, row * TILE, fw, TILE, px, py);
  }

  function drawBlockSprite(px, py) {
    if (!assets.ready || !assets.block) return false;
    return drawSheetFrame(assets.block, 0, 0, TILE, TILE, px, py);
  }

  let COLS = 20, ROWS = 15;

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
  let chipsCollected = 0, chipsNeeded = 0;
  let player = { x: 1, y: 1, dir: 0, frame: 0, moving: false, animTimer: 0 };
  let enemies = [];
  let map = [];          // terrain layer
  let overlay = [];      // items / keys / boots / buttons sitting on terrain
  let blocks = [];       // pushable blocks {x,y}
  let traps = [];        // {x,y, open}
  let cloners = [];      // {x,y, dir, template}
  let teleporters = [];  // {x,y}
  let toggleOpen = true; // green button state
  let gameState = "start";
  let customLevel = null, fromEditor = false;

  // Inventory
  let inv = { keys: {b:0,r:0,g:0,y:0}, boots: {flip:false, fire:false, ice:false, suction:false} };

  let editMap = [], editCols = 20, editRows = 15, selectedTile = "W", painting = false;
  let touchStartX = 0, touchStartY = 0, touchActive = false;
  const SWIPE_THRESHOLD = 24;

  // --- Tile IDs ---
  const T = {
    FLOOR: 0, WALL: 1, WATER: 2, FIRE: 3, ICE: 4,
    ICE_NW: 5, ICE_NE: 6, ICE_SW: 7, ICE_SE: 8,
    FORCE_N: 9, FORCE_E: 10, FORCE_S: 11, FORCE_W: 12, FORCE_R: 13,
    DIRT: 14, GRAVEL: 15,
    EXIT: 16, SOCKET: 17, CHIP: 18,
    HINT: 19,
    // walls variants
    INVIS: 20, HIDDEN: 21, RECESSED: 22, BLUE_REAL: 23, BLUE_FAKE: 24,
    // thin walls (block one side)
    THIN_N: 25, THIN_E: 26, THIN_S: 27, THIN_W: 28,
    // interactive
    TELEPORT: 29, BOMB: 30, THIEF: 31, TRAP: 32,
    TOGGLE_WALL: 33, TOGGLE_FLOOR: 34,
    CLONER: 35,
    BTN_GREEN: 36, BTN_RED: 37, BTN_BLUE: 38, BTN_BROWN: 39,
    // items (also on overlay)
    KEY_B: 40, KEY_R: 41, KEY_G: 42, KEY_Y: 43,
    LOCK_B: 44, LOCK_R: 45, LOCK_G: 46, LOCK_Y: 47,
    BOOT_FLIP: 48, BOOT_FIRE: 49, BOOT_ICE: 50, BOOT_SUCTION: 51,
    BLOCK: 52,
  };

  const DIR = { N: 0, E: 1, S: 2, W: 3 };
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

  // Char encoding for maps (printable, editor-friendly)
  // Terrain & objects
  const CHAR_TO_TILE = {
    ".": T.FLOOR, "W": T.WALL, "~": T.WATER, "F": T.FIRE, "I": T.ICE,
    "1": T.ICE_NW, "3": T.ICE_NE, "7": T.ICE_SW, "9": T.ICE_SE,
    "^": T.FORCE_N, ">": T.FORCE_E, "v": T.FORCE_S, "<": T.FORCE_W, "R": T.FORCE_R,
    "D": T.DIRT, "G": T.GRAVEL,
    "E": T.EXIT, "X": T.SOCKET, "C": T.CHIP, "?": T.HINT,
    "i": T.INVIS, "h": T.HIDDEN, "r": T.RECESSED,
    "[": T.BLUE_REAL, "]": T.BLUE_FAKE,
    "n": T.THIN_N, "e": T.THIN_E, "s": T.THIN_S, "w": T.THIN_W,
    "@": T.TELEPORT, "*": T.BOMB, "$": T.THIEF, "=": T.TRAP,
    "|": T.TOGGLE_WALL, "_": T.TOGGLE_FLOOR,
    "+": T.CLONER,
    "g": T.BTN_GREEN, "d": T.BTN_RED, "u": T.BTN_BLUE, "o": T.BTN_BROWN,
    "b": T.KEY_B, "y": T.KEY_R, "n": T.KEY_G, // conflict - use below
    "B": T.BLOCK,
  };
  // Cleaner explicit map for keys/boots/locks (avoid collisions)
  // Keys: b r g y   Locks: B R G Y (but B is block) -> use k/K pairs
  // Revised:
  // keys: 2=blue 4=red 6=green 8=yellow
  // locks: 0=blue 5=red %=green &=yellow
  // boots: f=flippers !=fire skates  j=ice skates  q=suction
  // monsters: p=ballH P=ballV m=glider z=fireball a=bug c=paramecium t=tank k=walker T=teeth x=blob
  // player: @ conflict with teleport -> use S for start? Keep P for player

  const TILE_CHARS = [
    ".", "W", "~", "F", "I", "1", "3", "7", "9",
    "^", ">", "v", "<", "R", "D", "G",
    "E", "X", "C", "?",
    "i", "h", "r", "[", "]",
    "N", "Y", "S", "Z", // thin N E S W (S conflicts start - use N E H Z)
    "@", "*", "$", "=",
    "|", "_", "+",
    "!", "#", "%", "&", // buttons green red blue brown
    "2", "4", "6", "8", // keys b r g y
    "0", "5", "7", "9", // locks - conflict ice - use ( ) { }
    "f", "j", "q", "l", // boots flip ice suction fireboots -> f j q !
    "B", // block
    "p", "P", "m", "z", "a", "c", "t", "k", "T", "x", // monsters
    "A" // player start (P was used)
  ];

  // Rebuild clean char map
  const CH = {
    ".": T.FLOOR, "W": T.WALL, "~": T.WATER, "F": T.FIRE, "I": T.ICE,
    "1": T.ICE_NW, "3": T.ICE_NE, "7": T.ICE_SW, "9": T.ICE_SE,
    "^": T.FORCE_N, ">": T.FORCE_E, "v": T.FORCE_S, "<": T.FORCE_W, "R": T.FORCE_R,
    "D": T.DIRT, "G": T.GRAVEL,
    "E": T.EXIT, "X": T.SOCKET, "C": T.CHIP, "?": T.HINT,
    "i": T.INVIS, "h": T.HIDDEN, "r": T.RECESSED,
    "[": T.BLUE_REAL, "]": T.BLUE_FAKE,
    "N": T.THIN_N, "Y": T.THIN_E, "H": T.THIN_S, "Z": T.THIN_W,
    "@": T.TELEPORT, "*": T.BOMB, "$": T.THIEF, "=": T.TRAP,
    "|": T.TOGGLE_WALL, "_": T.TOGGLE_FLOOR, "+": T.CLONER,
    "!": T.BTN_GREEN, "#": T.BTN_RED, "%": T.BTN_BLUE, "&": T.BTN_BROWN,
    "2": T.KEY_B, "4": T.KEY_R, "6": T.KEY_G, "8": T.KEY_Y,
    "(": T.LOCK_B, ")": T.LOCK_R, "{": T.LOCK_G, "}": T.LOCK_Y,
    "f": T.BOOT_FLIP, "j": T.BOOT_ICE, "q": T.BOOT_SUCTION, "l": T.BOOT_FIRE,
    "B": T.BLOCK,
  };

  const MONSTER_CHARS = {
    "p": { type: "ball", dir: DIR.E },
    "P": { type: "ball", dir: DIR.S },
    "m": { type: "glider", dir: DIR.E },
    "z": { type: "fireball", dir: DIR.E },
    "a": { type: "bug", dir: DIR.N },
    "c": { type: "paramecium", dir: DIR.N },
    "t": { type: "tank", dir: DIR.E },
    "k": { type: "walker", dir: DIR.E },
    "T": { type: "teeth", dir: DIR.S },
    "x": { type: "blob", dir: DIR.E },
  };

  const TILE_LABELS = {
    ".": "Floor", "W": "Wall", "~": "Water", "F": "Fire", "I": "Ice",
    "1": "Ice NW", "3": "Ice NE", "7": "Ice SW", "9": "Ice SE",
    "^": "Force N", ">": "Force E", "v": "Force S", "<": "Force W", "R": "Force Rand",
    "D": "Dirt", "G": "Gravel",
    "E": "Exit", "X": "Socket", "C": "Chip", "?": "Hint",
    "i": "Invis wall", "h": "Hidden wall", "r": "Recessed",
    "[": "Blue wall", "]": "Blue fake",
    "N": "Thin N", "Y": "Thin E", "H": "Thin S", "Z": "Thin W",
    "@": "Teleport", "*": "Bomb", "$": "Thief", "=": "Trap",
    "|": "Toggle wall", "_": "Toggle floor", "+": "Cloner",
    "!": "Btn green", "#": "Btn red", "%": "Btn blue", "&": "Btn brown",
    "2": "Key blue", "4": "Key red", "6": "Key green", "8": "Key yellow",
    "(": "Lock blue", ")": "Lock red", "{": "Lock green", "}": "Lock yellow",
    "f": "Flippers", "j": "Ice skates", "q": "Suction", "l": "Fire boots",
    "B": "Block",
    "p": "Ball H", "P": "Ball V", "m": "Glider", "z": "Fireball",
    "a": "Bug", "c": "Paramecium", "t": "Tank", "k": "Walker",
    "T": "Teeth", "x": "Blob", "A": "Player"
  };

  const ALL_CHARS = Object.keys(TILE_LABELS);

  // Built-in levels (simple demos of new tiles)
  const LEVELS = [
    // 1 - basics
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W........A.........W",
      "W..................W",
      "W....WWWW..........W",
      "W..................W",
      "W..........C.......W",
      "W......B...........W",
      "W....WWWW..........W",
      "W..................W",
      "W..................W",
      "W.............E....W",
      "W..................W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    // 2 - keys locks boots
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.A................W",
      "W.WWWW.WWWW.WWWW...W",
      "W......B...........W",
      "W.2....(...........W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W......4.....).....W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W.............X....W",
      "W.WWWW.WWWW.WWWW.E.W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    // 3 - water fire ice force + boots
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.A..f.j.l.q.......W",
      "W.~~~~~~~~~~~~~~~~~W",
      "W.FFFFFFF.IIIIIIIIIW",
      "W.^^^^^^^vvvvvvvvvvW",
      "W.>R<<<<<>>>>R<<<<<W",
      "W..................W",
      "W.C.C.C.C.C.C.C.C..W",
      "W..................W",
      "W........X.........W",
      "W........E.........W",
      "W..................W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    // 4 - monsters
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.A................W",
      "W....p.....P.......W",
      "W..................W",
      "W....m.....z.......W",
      "W..................W",
      "W....a.....c.......W",
      "W..................W",
      "W....t.....k.......W",
      "W..................W",
      "W....T.....x....C..W",
      "W...............X.EW",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    // 5 - mixed advanced
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.A.~.F.I.^.[.]....W",
      "W.D.G.r.h.i.N.Y.H.ZW",
      "W.@.*.$.=.|.+.!.#.%W",
      "W.2.4.6.8.(.).{.}.&W",
      "W.f.j.q.l.B.C.X.E.?W",
      "W.p.P.m.z.a.c.t.k.TW",
      "W.x................W",
      "W..................W",
      "W..................W",
      "W..................W",
      "W..................W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ]
  ];

  function resizeCanvas() {
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;
  }

  function isIce(t) {
    return t === T.ICE || t === T.ICE_NW || t === T.ICE_NE || t === T.ICE_SW || t === T.ICE_SE;
  }
  function isForce(t) {
    return t === T.FORCE_N || t === T.FORCE_E || t === T.FORCE_S || t === T.FORCE_W || t === T.FORCE_R;
  }
  function forceDirOf(t) {
    if (t === T.FORCE_N) return DIR.N;
    if (t === T.FORCE_E) return DIR.E;
    if (t === T.FORCE_S) return DIR.S;
    if (t === T.FORCE_W) return DIR.W;
    if (t === T.FORCE_R) return Math.floor(Math.random() * 4);
    return -1;
  }
  function iceRedirect(t, dir) {
    if (t === T.ICE_NW) { if (dir === DIR.N) return DIR.E; if (dir === DIR.W) return DIR.S; }
    if (t === T.ICE_NE) { if (dir === DIR.N) return DIR.W; if (dir === DIR.E) return DIR.S; }
    if (t === T.ICE_SW) { if (dir === DIR.S) return DIR.E; if (dir === DIR.W) return DIR.N; }
    if (t === T.ICE_SE) { if (dir === DIR.S) return DIR.W; if (dir === DIR.E) return DIR.N; }
    return dir;
  }
  function canEnterIceCorner(t, dir) {
    // solid sides block entry
    if (t === T.ICE_NW) return !(dir === DIR.S || dir === DIR.E);
    if (t === T.ICE_NE) return !(dir === DIR.S || dir === DIR.W);
    if (t === T.ICE_SW) return !(dir === DIR.N || dir === DIR.E);
    if (t === T.ICE_SE) return !(dir === DIR.N || dir === DIR.W);
    return true;
  }

  function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }

  function blockAt(x, y) {
    return blocks.find(b => b.x === x && b.y === y);
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
          // items go to overlay when appropriate
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
    // chips needed defaults to count if socket present
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

  function solidToPlayer(x, y, fromDir) {
    if (!inBounds(x, y)) return true;
    if (blockAt(x, y)) return true;
    const t = map[y][x];
    if (t === T.WALL || t === T.INVIS) return true;
    if (t === T.HIDDEN) { map[y][x] = T.WALL; return true; }
    if (t === T.BLUE_REAL) { map[y][x] = T.WALL; return true; }
    if (t === T.BLUE_FAKE) { map[y][x] = T.FLOOR; return false; }
    if (t === T.RECESSED) return false; // pass once then becomes wall after leave
    if (t === T.TOGGLE_WALL && !toggleOpen) return true;
    if (t === T.TOGGLE_FLOOR && toggleOpen) return true;
    if (t === T.TRAP) {
      const tr = traps.find(tr => tr.x === x && tr.y === y);
      if (tr && !tr.open) return true;
    }
    // locks
    if (t === T.LOCK_B && inv.keys.b <= 0) return true;
    if (t === T.LOCK_R && inv.keys.r <= 0) return true;
    if (t === T.LOCK_G && inv.keys.g <= 0) return true;
    if (t === T.LOCK_Y && inv.keys.y <= 0) return true;
    // thin walls
    if (t === T.THIN_N && fromDir === DIR.S) return true;
    if (t === T.THIN_S && fromDir === DIR.N) return true;
    if (t === T.THIN_E && fromDir === DIR.W) return true;
    if (t === T.THIN_W && fromDir === DIR.E) return true;
    // ice corners
    if (isIce(t) && t !== T.ICE && !canEnterIceCorner(t, fromDir)) return true;
    // water / fire without boots
    if (t === T.WATER && !inv.boots.flip) return true;
    if (t === T.FIRE && !inv.boots.fire) return true;
    // socket
    if (t === T.SOCKET && chipsCollected < chipsNeeded) return true;
    // gravel/dirt monsters blocked but player ok
    return false;
  }

  function solidToMonster(e, x, y) {
    if (!inBounds(x, y)) return true;
    if (blockAt(x, y)) return true;
    const t = map[y][x];
    if (t === T.WALL || t === T.INVIS || t === T.HIDDEN || t === T.BLUE_REAL) return true;
    if (t === T.DIRT || t === T.GRAVEL) return true;
    if (t === T.RECESSED) return true;
    if (t === T.TOGGLE_WALL && !toggleOpen) return true;
    if (t === T.TOGGLE_FLOOR && toggleOpen) return true;
    if (t === T.SOCKET || t === T.EXIT || t === T.LOCK_B || t === T.LOCK_R || t === T.LOCK_G || t === T.LOCK_Y) return true;
    if (t === T.TRAP) {
      const tr = traps.find(tr => tr.x === x && tr.y === y);
      if (tr && !tr.open) return true;
    }
    if (t === T.WATER && e.type !== "glider") return true;
    if (t === T.FIRE && e.type !== "fireball") return true;
    if (isIce(t) && t !== T.ICE && !canEnterIceCorner(t, e.dir)) return true;
    return false;
  }

  function isSlide(t) { return isIce(t) || isForce(t); }

  function slidePath(sx, sy, dir, isBlock) {
    let x = sx, y = sy, d = dir;
    let steps = 0;
    while (steps++ < COLS * ROWS + 4) {
      const tHere = map[y][x];
      if (isIce(tHere) && tHere !== T.ICE) d = iceRedirect(tHere, d);
      if (isForce(tHere)) {
        if (isBlock || !inv.boots.suction) d = forceDirOf(tHere);
      }
      const nx = x + DX[d], ny = y + DY[d];
      if (isBlock) {
        if (!inBounds(nx, ny) || blockAt(nx, ny)) break;
        const nt = map[ny][nx];
        if (nt === T.WALL || nt === T.INVIS) break;
        x = nx; y = ny;
        if (nt === T.WATER) break;
        if (!isSlide(nt)) break;
      } else {
        if (solidToPlayer(nx, ny, d)) break;
        // ice skates: stop sliding on ice
        const nt = map[ny][nx];
        if (isIce(nt) && inv.boots.ice) { x = nx; y = ny; break; }
        if (isForce(nt) && inv.boots.suction) { x = nx; y = ny; break; }
        x = nx; y = ny;
        if (!isSlide(nt)) break;
      }
    }
    return { x, y, dir: d };
  }

  function tryMove(dx, dy) {
    if (gameState !== "play") return;
    let dir = dx > 0 ? DIR.E : dx < 0 ? DIR.W : dy > 0 ? DIR.S : DIR.N;
    const nx = player.x + dx, ny = player.y + dy;
    if (!inBounds(nx, ny)) return;

    // push block?
    const blk = blockAt(nx, ny);
    if (blk) {
      const bx = nx + dx, by = ny + dy;
      if (!inBounds(bx, by) || blockAt(bx, by) || solidToPlayer(bx, by, dir)) {
        statusEl.textContent = "Can't push!";
        return;
      }
      // move block
      blk.x = bx; blk.y = by;
      const destT = map[by][bx];
      if (destT === T.WATER) {
        blocks = blocks.filter(b => b !== blk);
        map[by][bx] = T.DIRT; // becomes dirt (CC1)
        statusEl.textContent = "Block filled water!";
      } else if (destT === T.BOMB) {
        blocks = blocks.filter(b => b !== blk);
        map[by][bx] = T.FLOOR;
        statusEl.textContent = "Bomb!";
      } else if (isSlide(destT)) {
        const fin = slidePath(bx, by, dir, true);
        blk.x = fin.x; blk.y = fin.y;
        if (map[fin.y][fin.x] === T.WATER) {
          blocks = blocks.filter(b => b !== blk);
          map[fin.y][fin.x] = T.DIRT;
          statusEl.textContent = "Block slid into water!";
        }
      }
      player.x = nx; player.y = ny;
    } else if (!solidToPlayer(nx, ny, dir)) {
      const target = map[ny][nx];
      if (isSlide(target) && !(isIce(target) && inv.boots.ice) && !(isForce(target) && inv.boots.suction)) {
        const fin = slidePath(nx, ny, dir, false);
        player.x = fin.x; player.y = fin.y; dir = fin.dir;
        statusEl.textContent = isForce(target) ? "Force!" : "Slide!";
      } else {
        player.x = nx; player.y = ny;
      }
    } else return;

    player.dir = dir === DIR.E ? 0 : dir === DIR.W ? 1 : dir === DIR.S ? 2 : 3;
    player.moving = true; player.animTimer = 0;

    // land effects
    const lx = player.x, ly = player.y;
    const land = map[ly][lx];
    const ov = overlay[ly][lx];

    // recessed becomes wall after stepping
    if (land === T.RECESSED) map[ly][lx] = T.WALL;

    // dirt becomes floor
    if (land === T.DIRT) map[ly][lx] = T.FLOOR;

    // collect overlay items
    if (ov === T.CHIP) {
      overlay[ly][lx] = null; chipsCollected++;
      keyCountEl.textContent = chipsCollected + "/" + chipsNeeded;
      statusEl.textContent = "Chip!";
    } else if (ov === T.KEY_B) { overlay[ly][lx] = null; inv.keys.b++; statusEl.textContent = "Blue key!"; }
    else if (ov === T.KEY_R) { overlay[ly][lx] = null; inv.keys.r++; statusEl.textContent = "Red key!"; }
    else if (ov === T.KEY_G) { overlay[ly][lx] = null; inv.keys.g++; statusEl.textContent = "Green key!"; }
    else if (ov === T.KEY_Y) { overlay[ly][lx] = null; inv.keys.y++; statusEl.textContent = "Yellow key!"; }
    else if (ov === T.BOOT_FLIP) { overlay[ly][lx] = null; inv.boots.flip = true; statusEl.textContent = "Flippers!"; }
    else if (ov === T.BOOT_FIRE) { overlay[ly][lx] = null; inv.boots.fire = true; statusEl.textContent = "Fire boots!"; }
    else if (ov === T.BOOT_ICE) { overlay[ly][lx] = null; inv.boots.ice = true; statusEl.textContent = "Ice skates!"; }
    else if (ov === T.BOOT_SUCTION) { overlay[ly][lx] = null; inv.boots.suction = true; statusEl.textContent = "Suction boots!"; }

    // terrain pickups that are on map layer
    if (land === T.KEY_B) { map[ly][lx] = T.FLOOR; inv.keys.b++; }
    if (land === T.KEY_R) { map[ly][lx] = T.FLOOR; inv.keys.r++; }
    if (land === T.KEY_G) { map[ly][lx] = T.FLOOR; inv.keys.g++; }
    if (land === T.KEY_Y) { map[ly][lx] = T.FLOOR; inv.keys.y++; }

    // open locks
    if (land === T.LOCK_B && inv.keys.b > 0) { map[ly][lx] = T.FLOOR; inv.keys.b--; statusEl.textContent = "Blue lock!"; }
    if (land === T.LOCK_R && inv.keys.r > 0) { map[ly][lx] = T.FLOOR; inv.keys.r--; statusEl.textContent = "Red lock!"; }
    if (land === T.LOCK_G && inv.keys.g > 0) { map[ly][lx] = T.FLOOR; inv.keys.g--; statusEl.textContent = "Green lock!"; }
    if (land === T.LOCK_Y && inv.keys.y > 0) { map[ly][lx] = T.FLOOR; inv.keys.y--; statusEl.textContent = "Yellow lock!"; }

    // socket
    if (land === T.SOCKET && chipsCollected >= chipsNeeded) {
      map[ly][lx] = T.FLOOR; statusEl.textContent = "Socket open!";
    }

    // thief
    if (land === T.THIEF) {
      inv.boots = { flip:false, fire:false, ice:false, suction:false };
      statusEl.textContent = "Thief stole boots!";
    }

    // bomb
    if (land === T.BOMB) {
      gameState = "dead"; showScreen(gameOver); return;
    }

    // buttons
    if (land === T.BTN_GREEN) {
      toggleOpen = !toggleOpen;
      statusEl.textContent = toggleOpen ? "Toggles open" : "Toggles closed";
    }
    if (land === T.BTN_BLUE) {
      // reverse all tanks
      enemies.forEach(e => { if (e.type === "tank") e.dir = (e.dir + 2) % 4; });
      statusEl.textContent = "Tanks reversed!";
    }
    if (land === T.BTN_BROWN) {
      traps.forEach(tr => { tr.open = true; });
      statusEl.textContent = "Traps open!";
    }
    if (land === T.BTN_RED) {
      // clone from each cloner
      cloners.forEach(cl => {
        const cx = cl.x + DX[cl.dir], cy = cl.y + DY[cl.dir];
        if (inBounds(cx, cy) && !blockAt(cx, cy) && !solidToMonster({type:cl.template,dir:cl.dir}, cx, cy)) {
          enemies.push({ x: cx, y: cy, dir: cl.dir, type: cl.template, timer: 0, step: 0 });
        }
      });
      statusEl.textContent = "Cloned!";
    }

    // teleport
    if (land === T.TELEPORT && teleporters.length > 1) {
      // reverse reading order: previous teleport
      const idx = teleporters.findIndex(tp => tp.x === lx && tp.y === ly);
      for (let i = 1; i <= teleporters.length; i++) {
        const tp = teleporters[(idx - i + teleporters.length * 2) % teleporters.length];
        const tx = tp.x + DX[dir], ty = tp.y + DY[dir];
        if (!solidToPlayer(tx, ty, dir)) {
          player.x = tx; player.y = ty;
          statusEl.textContent = "Teleport!";
          break;
        }
      }
    }

    // fire / water death (if somehow)
    const finalT = map[player.y][player.x];
    if (finalT === T.FIRE && !inv.boots.fire) { gameState = "dead"; showScreen(gameOver); return; }
    if (finalT === T.WATER && !inv.boots.flip) { gameState = "dead"; showScreen(gameOver); return; }

    // exit
    if (finalT === T.EXIT) {
      if (chipsCollected >= chipsNeeded) {
        if (customLevel || fromEditor) {
          gameState = "win"; showScreen(winScreen);
          winScreen.querySelector("p").textContent = fromEditor ? "Custom level cleared!" : "Custom cleared!";
        } else if (level >= LEVELS.length - 1) {
          gameState = "win"; showScreen(winScreen);
          winScreen.querySelector("p").textContent = "Joe juked through all levels!";
        } else {
          gameState = "levelDone"; showScreen(levelComplete);
        }
      } else statusEl.textContent = "Need more chips!";
    }

    // monster collision
    if (enemies.some(e => e.x === player.x && e.y === player.y)) {
      gameState = "dead"; showScreen(gameOver);
    }
  }

  function turnLeft(d) { return (d + 3) % 4; }
  function turnRight(d) { return (d + 1) % 4; }
  function turnAround(d) { return (d + 2) % 4; }

  function pickMonsterDir(e) {
    const can = (d) => !solidToMonster(e, e.x + DX[d], e.y + DY[d]);
    if (e.type === "ball" || e.type === "tank") {
      return can(e.dir) ? e.dir : turnAround(e.dir);
    }
    if (e.type === "glider") {
      for (const d of [e.dir, turnLeft(e.dir), turnRight(e.dir), turnAround(e.dir)])
        if (can(d)) return d;
      return e.dir;
    }
    if (e.type === "fireball") {
      for (const d of [e.dir, turnRight(e.dir), turnLeft(e.dir), turnAround(e.dir)])
        if (can(d)) return d;
      return e.dir;
    }
    if (e.type === "bug") {
      for (const d of [turnLeft(e.dir), e.dir, turnRight(e.dir), turnAround(e.dir)])
        if (can(d)) return d;
      return e.dir;
    }
    if (e.type === "paramecium") {
      for (const d of [turnRight(e.dir), e.dir, turnLeft(e.dir), turnAround(e.dir)])
        if (can(d)) return d;
      return e.dir;
    }
    if (e.type === "walker" || e.type === "blob") {
      const opts = [0,1,2,3].filter(can);
      if (!opts.length) return e.dir;
      if (can(e.dir) && e.type === "walker" && Math.random() < 0.5) return e.dir;
      return opts[Math.floor(Math.random() * opts.length)];
    }
    if (e.type === "teeth") {
      const adx = player.x - e.x, ady = player.y - e.y;
      const prefer = [];
      if (Math.abs(adx) >= Math.abs(ady)) {
        prefer.push(adx > 0 ? DIR.E : DIR.W, ady > 0 ? DIR.S : DIR.N);
      } else {
        prefer.push(ady > 0 ? DIR.S : DIR.N, adx > 0 ? DIR.E : DIR.W);
      }
      prefer.push(e.dir, turnLeft(e.dir), turnRight(e.dir), turnAround(e.dir));
      for (const d of prefer) if (can(d)) return d;
      return e.dir;
    }
    return can(e.dir) ? e.dir : turnAround(e.dir);
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      e.timer += dt;
      const interval = e.type === "teeth" || e.type === "blob" ? 0.5 : 0.38;
      if (e.timer < interval) continue;
      e.timer = 0;
      e.step++;

      // teeth move every other step
      if (e.type === "teeth" && e.step % 2 === 0) continue;

      let d = pickMonsterDir(e);
      e.dir = d;
      const nx = e.x + DX[d], ny = e.y + DY[d];
      if (solidToMonster(e, nx, ny)) continue;

      const nt = map[ny][nx];
      if (isSlide(nt)) {
        const fin = slidePath(nx, ny, d, false);
        // don't drown non-gliders
        if (map[fin.y][fin.x] === T.WATER && e.type !== "glider") {
          e.x = nx; e.y = ny;
        } else {
          e.x = fin.x; e.y = fin.y; e.dir = fin.dir;
        }
      } else {
        e.x = nx; e.y = ny;
      }

      // monster on bomb
      if (map[e.y][e.x] === T.BOMB) {
        map[e.y][e.x] = T.FLOOR;
        enemies = enemies.filter(en => en !== e);
        continue;
      }

      if (e.x === player.x && e.y === player.y) {
        gameState = "dead"; showScreen(gameOver);
      }
    }
  }

  // --- Drawing helpers (sprite sheets with procedural fallback) ---
  function drawJoe(px, py, dir, frame) {
    if (drawJoeSprite(px, py, dir, frame)) return;
    const bob = player.moving ? Math.sin(frame * 12) * 1.5 : 0;
    ctx.fillStyle = "#1a252f";
    if (player.moving) {
      ctx.fillRect(px + 8, py + 22 + bob, 6, 8);
      ctx.fillRect(px + 18, py + 22 - bob, 6, 8);
    } else {
      ctx.fillRect(px + 9, py + 22, 6, 8);
      ctx.fillRect(px + 17, py + 22, 6, 8);
    }
    ctx.fillStyle = "#3498db";
    ctx.fillRect(px + 7, py + 10 + bob, 18, 14);
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(px + 7, py + 10 + bob, 18, 3);
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath(); ctx.arc(px + 16, py + 7 + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(px + 12, py + 5 + bob, 2, 2);
    ctx.fillRect(px + 18, py + 5 + bob, 2, 2);
    ctx.fillStyle = "#e74c3c";
    if (dir === 0) ctx.fillRect(px + 22, py + 14 + bob, 4, 2);
    else if (dir === 1) ctx.fillRect(px + 6, py + 14 + bob, 4, 2);
    else if (dir === 2) ctx.fillRect(px + 15, py + 20 + bob, 2, 4);
    else ctx.fillRect(px + 15, py + 4 + bob, 2, 4);
  }

  function drawBlock(px, py) {
    if (drawBlockSprite(px, py)) return;
    ctx.fillStyle = "#6B4226";
    ctx.fillRect(px + 2, py + 2, 28, 28);
    ctx.fillStyle = "#A0522D";
    ctx.fillRect(px + 4, py + 4, 24, 24);
    ctx.strokeStyle = "#3E2723";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, 24, 24);
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 16); ctx.lineTo(px + 28, py + 16);
    ctx.moveTo(px + 16, py + 4); ctx.lineTo(px + 16, py + 28);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(255,220,150,0.25)";
    ctx.fillRect(px + 6, py + 6, 10, 6);
  }

  function drawTerrain(t, px, py) {
    if (drawTerrainSprite(t, px, py)) return;

    const checker = ((px / TILE) + (py / TILE)) % 2 === 0;
    ctx.fillStyle = checker ? "#252535" : "#1e1e2e";
    ctx.fillRect(px, py, TILE, TILE);

    if (t === T.WALL) {
      ctx.fillStyle = "#3d3d5c"; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    } else if (t === T.WATER) {
      ctx.fillStyle = "#1a5a8a"; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = "rgba(100,180,255,0.35)";
      ctx.fillRect(px + 4, py + 8, 8, 4); ctx.fillRect(px + 16, py + 18, 10, 3);
    } else if (t === T.FIRE) {
      ctx.fillStyle = "#c0392b"; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = "#e67e22";
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 24); ctx.lineTo(px + 12, py + 10);
      ctx.lineTo(px + 16, py + 18); ctx.lineTo(px + 20, py + 8);
      ctx.lineTo(px + 24, py + 24); ctx.closePath(); ctx.fill();
    } else if (t === T.ICE || t === T.ICE_NW || t === T.ICE_NE || t === T.ICE_SW || t === T.ICE_SE) {
      ctx.fillStyle = "#a0d8ef"; ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.strokeRect(px + 3, py + 3, 26, 26);
      ctx.fillStyle = "#3d3d5c";
      if (t === T.ICE_NW) { ctx.fillRect(px, py, TILE, 4); ctx.fillRect(px, py, 4, TILE); }
      if (t === T.ICE_NE) { ctx.fillRect(px, py, TILE, 4); ctx.fillRect(px + 28, py, 4, TILE); }
      if (t === T.ICE_SW) { ctx.fillRect(px, py + 28, TILE, 4); ctx.fillRect(px, py, 4, TILE); }
      if (t === T.ICE_SE) { ctx.fillRect(px, py + 28, TILE, 4); ctx.fillRect(px + 28, py, 4, TILE); }
    } else if (isForce(t)) {
      const rnd = t === T.FORCE_R;
      ctx.fillStyle = rnd ? "#1a4a3a" : "#2d5a27";
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = rnd ? "#a0ffd0" : "#7dffc4";
      const cx = px + 16, cy = py + 16;
      if (rnd) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy - 4);
        ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx + 4, cy - 4);
        ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx - 4, cy + 4);
        ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx - 4, cy - 4);
        ctx.fill();
      } else {
        const d = forceDirOf(t);
        ctx.beginPath();
        if (d === DIR.N) { ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 8, cy + 4); ctx.lineTo(cx - 8, cy + 4); }
        else if (d === DIR.E) { ctx.moveTo(cx + 10, cy); ctx.lineTo(cx - 4, cy + 8); ctx.lineTo(cx - 4, cy - 8); }
        else if (d === DIR.S) { ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 8, cy - 4); ctx.lineTo(cx - 8, cy - 4); }
        else { ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 4, cy + 8); ctx.lineTo(cx + 4, cy - 8); }
        ctx.closePath(); ctx.fill();
      }
    } else if (t === T.DIRT) {
      ctx.fillStyle = "#6B4226"; ctx.fillRect(px, py, TILE, TILE);
    } else if (t === T.GRAVEL) {
      ctx.fillStyle = "#7f8c8d"; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = "#95a5a6";
      for (let i = 0; i < 6; i++) ctx.fillRect(px + 4 + (i % 3) * 8, py + 6 + Math.floor(i / 3) * 12, 3, 3);
    } else if (t === T.EXIT) {
      ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 4, py + 4, 24, 24);
      ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.fillText("E", px + 11, py + 20);
    } else if (t === T.SOCKET) {
      ctx.fillStyle = "#34495e"; ctx.fillRect(px + 4, py + 4, 24, 24);
      ctx.fillStyle = "#ecf0f1"; ctx.font = "bold 11px sans-serif"; ctx.fillText("X", px + 11, py + 20);
    } else if (t === T.HINT) {
      ctx.fillStyle = "#f39c12"; ctx.fillRect(px + 6, py + 6, 20, 20);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("?", px + 11, py + 22);
    } else if (t === T.INVIS || t === T.HIDDEN) {
      // look like floor
    } else if (t === T.RECESSED) {
      ctx.fillStyle = "#4a4a6a"; ctx.fillRect(px + 4, py + 4, 24, 24);
    } else if (t === T.BLUE_REAL || t === T.BLUE_FAKE) {
      ctx.fillStyle = "#2980b9"; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = "#3498db"; ctx.fillRect(px + 2, py + 2, 28, 28);
    } else if (t === T.THIN_N) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py, TILE, 4); }
    else if (t === T.THIN_S) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py + 28, TILE, 4); }
    else if (t === T.THIN_E) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px + 28, py, 4, TILE); }
    else if (t === T.THIN_W) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py, 4, TILE); }
    else if (t === T.TELEPORT) {
      ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d2b4de"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 6, 0, Math.PI * 2); ctx.fill();
    } else if (t === T.BOMB) {
      ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.arc(px + 16, py + 18, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e74c3c"; ctx.fillRect(px + 14, py + 6, 4, 6);
    } else if (t === T.THIEF) {
      ctx.fillStyle = "#7f8c8d"; ctx.fillRect(px + 8, py + 8, 16, 16);
      ctx.fillStyle = "#e74c3c"; ctx.font = "bold 10px sans-serif"; ctx.fillText("$", px + 11, py + 20);
    } else if (t === T.TRAP) {
      const tr = traps.find(tr => tr.x === px / TILE && tr.y === py / TILE);
      ctx.fillStyle = tr && tr.open ? "#27ae60" : "#c0392b";
      ctx.fillRect(px + 6, py + 6, 20, 20);
    } else if (t === T.TOGGLE_WALL) {
      ctx.fillStyle = toggleOpen ? "#1e1e2e" : "#3d3d5c";
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = "#4ecca3"; ctx.strokeRect(px + 2, py + 2, 28, 28);
    } else if (t === T.TOGGLE_FLOOR) {
      ctx.fillStyle = toggleOpen ? "#3d3d5c" : "#1e1e2e";
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = "#4ecca3"; ctx.strokeRect(px + 2, py + 2, 28, 28);
    } else if (t === T.CLONER) {
      ctx.fillStyle = "#16a085"; ctx.fillRect(px + 4, py + 4, 24, 24);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("+", px + 11, py + 22);
    } else if (t === T.BTN_GREEN) {
      ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
    } else if (t === T.BTN_RED) {
      ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
    } else if (t === T.BTN_BLUE) {
      ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
    } else if (t === T.BTN_BROWN) {
      ctx.fillStyle = "#a0522d"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
    } else if (t === T.LOCK_B) {
      ctx.fillStyle = "#2980b9"; ctx.fillRect(px + 6, py + 6, 20, 20);
    } else if (t === T.LOCK_R) {
      ctx.fillStyle = "#c0392b"; ctx.fillRect(px + 6, py + 6, 20, 20);
    } else if (t === T.LOCK_G) {
      ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 6, py + 6, 20, 20);
    } else if (t === T.LOCK_Y) {
      ctx.fillStyle = "#f1c40f"; ctx.fillRect(px + 6, py + 6, 20, 20);
    }
  }

  function drawOverlayItem(ov, px, py) {
    if (!ov) return;
    if (drawItemSprite(ov, px, py)) return;
    if (ov === T.CHIP) {
      // classic computer chip
      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(px + 8, py + 6, 16, 20);
      ctx.fillStyle = "#d4ac0d";
      ctx.fillRect(px + 10, py + 8, 12, 16);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("C", px + 12, py + 20);
    } else if (ov === T.KEY_B || ov === T.KEY_R || ov === T.KEY_G || ov === T.KEY_Y) {
      const col = ov === T.KEY_B ? "#3498db" : ov === T.KEY_R ? "#e74c3c" : ov === T.KEY_G ? "#2ecc71" : "#f1c40f";
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px + 16, py + 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(px + 14, py + 16, 4, 9);
      ctx.fillRect(px + 14, py + 22, 8, 3);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath(); ctx.arc(px + 14, py + 10, 2, 0, Math.PI * 2); ctx.fill();
    } else if (ov === T.BOOT_FLIP || ov === T.BOOT_FIRE || ov === T.BOOT_ICE || ov === T.BOOT_SUCTION) {
      const col = ov === T.BOOT_FLIP ? "#3498db" : ov === T.BOOT_FIRE ? "#e67e22" : ov === T.BOOT_ICE ? "#85c1e9" : "#2ecc71";
      ctx.fillStyle = col;
      ctx.fillRect(px + 7, py + 12, 18, 14);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(px + 7, py + 20, 18, 6);
      // sole
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(px + 6, py + 24, 20, 3);
    }
  }

  function drawEnemy(e, px, py) {
    if (drawMonsterSprite(e, px, py)) return;
    const type = e.type;
    const cx = px + 16, cy = py + 16;
    if (type === "ball") {
      // classic pink ball
      ctx.fillStyle = "#ff69b4";
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type === "glider") {
      // blue diamond / kite
      ctx.fillStyle = "#3498db";
      ctx.beginPath();
      ctx.moveTo(cx, py + 3); ctx.lineTo(px + 29, cy);
      ctx.lineTo(cx, py + 29); ctx.lineTo(px + 3, cy);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#85c1e9";
      ctx.beginPath();
      ctx.moveTo(cx, py + 8); ctx.lineTo(px + 24, cy);
      ctx.lineTo(cx, py + 24); ctx.lineTo(px + 8, cy);
      ctx.closePath(); ctx.fill();
    } else if (type === "fireball") {
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e67e22";
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    } else if (type === "bug") {
      // yellow oval with legs hint
      ctx.fillStyle = "#f4d03f";
      ctx.beginPath(); ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#b7950b";
      ctx.fillRect(px + 4, cy - 1, 4, 2);
      ctx.fillRect(px + 24, cy - 1, 4, 2);
    } else if (type === "paramecium") {
      ctx.fillStyle = "#1abc9c";
      const rot = (e.dir % 2 === 0) ? Math.PI / 2 : 0;
      ctx.beginPath(); ctx.ellipse(cx, cy, 14, 7, rot, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0e6655";
      ctx.beginPath(); ctx.ellipse(cx, cy, 8, 3, rot, 0, Math.PI * 2); ctx.fill();
    } else if (type === "tank") {
      ctx.fillStyle = "#16a085";
      ctx.fillRect(px + 3, py + 7, 26, 18);
      ctx.fillStyle = "#0e6655";
      ctx.fillRect(px + 5, py + 9, 22, 14);
      // barrel
      ctx.fillStyle = "#1a5276";
      if (e.dir === DIR.E) ctx.fillRect(px + 22, py + 13, 10, 6);
      else if (e.dir === DIR.W) ctx.fillRect(px + 0, py + 13, 10, 6);
      else if (e.dir === DIR.N) ctx.fillRect(px + 13, py + 0, 6, 10);
      else ctx.fillRect(px + 13, py + 22, 6, 10);
    } else if (type === "walker") {
      // purple biped
      ctx.fillStyle = "#8e44ad";
      ctx.fillRect(px + 8, py + 5, 16, 18);
      ctx.fillStyle = "#5b2c6f";
      ctx.fillRect(px + 10, py + 20, 5, 7);
      ctx.fillRect(px + 17, py + 20, 5, 7);
      ctx.fillStyle = "#d7bde2";
      ctx.fillRect(px + 11, py + 8, 4, 4);
      ctx.fillRect(px + 17, py + 8, 4, 4);
    } else if (type === "teeth") {
      // green chaser with teeth
      ctx.fillStyle = "#27ae60";
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(px + 9, py + 22, 3, 5);
      ctx.fillRect(px + 14, py + 23, 3, 5);
      ctx.fillRect(px + 19, py + 22, 3, 5);
      // eyes
      ctx.fillStyle = "#1e8449";
      ctx.fillRect(px + 10, py + 10, 3, 3);
      ctx.fillRect(px + 19, py + 10, 3, 3);
    } else if (type === "blob") {
      ctx.fillStyle = "#58d68d";
      ctx.beginPath(); ctx.ellipse(cx, cy, 13, 11, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath(); ctx.ellipse(cx - 3, cy - 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawMapTiles(useEdit) {
    const rows = useEdit ? editRows : ROWS;
    const cols = useEdit ? editCols : COLS;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * TILE, py = y * TILE;
        if (useEdit) {
          const ch = (editMap[y] && editMap[y][x]) || ".";
          if (CH[ch] !== undefined) drawTerrain(CH[ch], px, py);
          else if (MONSTER_CHARS[ch]) {
            drawTerrain(T.FLOOR, px, py);
            drawEnemy({ type: MONSTER_CHARS[ch].type, dir: MONSTER_CHARS[ch].dir }, px, py);
          } else if (ch === "A") {
            drawTerrain(T.FLOOR, px, py);
            drawJoe(px, py, 0, 0);
          } else drawTerrain(T.FLOOR, px, py);
        } else {
          drawTerrain(map[y][x], px, py);
          drawOverlayItem(overlay[y][x], px, py);
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
    for (const b of blocks) drawBlock(b.x * TILE, b.y * TILE);
    for (const e of enemies) drawEnemy(e, e.x * TILE, e.y * TILE);
    drawJoe(player.x * TILE, player.y * TILE, player.dir, player.animTimer);
  }

  // --- Editor ---
  function initEmptyMap(cols, rows) {
    editCols = cols; editRows = rows; editMap = [];
    for (let y = 0; y < rows; y++) {
      let row = "";
      for (let x = 0; x < cols; x++)
        row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "W" : ".";
      editMap.push(row);
    }
    setEditChar(1, 1, "A");
    setEditChar(cols - 2, rows - 2, "E");
  }
  function setEditChar(x, y, ch) {
    if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
    if (ch === "A" || ch === "E") {
      for (let yy = 0; yy < editRows; yy++)
        for (let xx = 0; xx < editCols; xx++)
          if (editMap[yy][xx] === ch)
            editMap[yy] = editMap[yy].substring(0, xx) + "." + editMap[yy].substring(xx + 1);
    }
    editMap[y] = editMap[y].substring(0, x) + ch + editMap[y].substring(x + 1);
  }
  function buildPalette() {
    const palette = document.getElementById("palette");
    palette.innerHTML = "";
    ALL_CHARS.forEach(ch => {
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
    statusEl.textContent = "Editor";
    levelNumEl.textContent = "Edit";
    levelTotalEl.textContent = "—";
  }
  function canvasToTile(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
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
    return { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 3 };
  }

  // --- Input & loop ---
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
    initEmptyMap(editCols, editRows); statusEl.textContent = "Cleared";
  });
  on("testLevelBtn", () => {
    if (!editMap.some(row => row.includes("A"))) { statusEl.textContent = "Place Player (A)!"; return; }
    if (!editMap.some(row => row.includes("E"))) { statusEl.textContent = "Place Exit (E)!"; return; }
    loadCustomLevel(getLevelData(), true);
  });
  on("exportBtn", () => {
    document.getElementById("exportText").value = JSON.stringify(getLevelData(), null, 2);
    showScreen(exportModal);
  });
  on("closeExportBtn", () => {
    hideAllScreens(); editorBar.classList.remove("hidden");
    gameState = "editor"; document.body.classList.add("editor-mode");
  });
  on("copyExportBtn", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("exportText").value);
      statusEl.textContent = "Copied!";
    } catch { document.getElementById("exportText").select(); document.execCommand("copy"); }
  });
  on("downloadExportBtn", () => {
    const blob = new Blob([document.getElementById("exportText").value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "joejuke-level.json"; a.click();
    URL.revokeObjectURL(url);
  });
  on("importBtn", () => {
    document.getElementById("importText").value = ""; showScreen(importModal);
  });
  on("importStartBtn", () => {
    document.getElementById("importText").value = ""; showScreen(importModal);
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
    // redraw once assets arrive so first frames aren't procedural-only
  });
  requestAnimationFrame(loop);
  window.__JOEJUKE_READY__ = true;
})();

/**
 * Joe's Juke — tile IDs, directions, 2-char ID maps, sprite indices
 *
 * Tile / entity IDs are unique 2-character alphanumeric codes
 * (a-z A-Z 0-9 → 3,844 slots). Systematic allocation:
 *
 *   00              floor
 *   99 / 98 / 97    wall / hidden wall / invisible wall
 *   ~~ FF II …      terrain mnemonics where clear
 *   K* L* B*        keys / locks / boots (case-sensitive)
 *   m*              monsters (always start with lowercase m)
 *   J0              Joe (player start)
 */
"use strict";

var TILE = 32;

/** Chip's Challenge-style field of view (tiles), centered on the player in play mode. */
var VIEW_COLS = 9;
var VIEW_ROWS = 9;

/** Seconds per tile while Joe slides on ice / force floors. Lower = faster. */
var slidePace = 0.08;

var T = {
  FLOOR: 0, WALL: 1, WATER: 2, FIRE: 3, ICE: 4,
  ICE_NW: 5, ICE_NE: 6, ICE_SW: 7, ICE_SE: 8,
  FORCE_N: 9, FORCE_E: 10, FORCE_S: 11, FORCE_W: 12, FORCE_R: 13,
  DIRT: 14, GRAVEL: 15,
  EXIT: 16, SOCKET: 17, CHIP: 18,
  HINT: 19,
  INVIS: 20, HIDDEN: 21, RECESSED: 22, BLUE_REAL: 23, BLUE_FAKE: 24,
  THIN_N: 25, THIN_E: 26, THIN_S: 27, THIN_W: 28,
  TELEPORT: 29, BOMB: 30, THIEF: 31, TRAP: 32,
  TOGGLE_WALL: 33, TOGGLE_FLOOR: 34,
  CLONER: 35,
  BTN_GREEN: 36, BTN_RED: 37, BTN_BLUE: 38, BTN_BROWN: 39,
  KEY_B: 40, KEY_R: 41, KEY_G: 42, KEY_Y: 43,
  LOCK_B: 44, LOCK_R: 45, LOCK_G: 46, LOCK_Y: 47,
  BOOT_FLIP: 48, BOOT_FIRE: 49, BOOT_ICE: 50, BOOT_SUCTION: 51,
  BLOCK: 52,
};

var DIR = { N: 0, E: 1, S: 2, W: 3 };
var DX = [0, 1, 0, -1];
var DY = [-1, 0, 1, 0];

var TERRAIN_IDX = {
  0: 0,
  1: 2, 2: 3, 3: 4, 4: 5,
  5: 6, 6: 7, 7: 8, 8: 9,
  9: 10, 10: 11, 11: 12, 12: 13, 13: 14,
  14: 15, 15: 16, 16: 17, 17: 18,
  19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24,
  25: 25, 26: 26, 27: 27, 28: 28,
  29: 29, 30: 30, 31: 31, 32: 32,
  33: 34, 34: 35, 35: 36,
};

var ITEM_IDX = {
  18: 0,
  40: 1, 41: 2, 42: 3, 43: 4,
  48: 5, 49: 6, 50: 7, 51: 8,
  44: 10, 45: 11, 46: 12, 47: 13,
  36: 14, 37: 15, 38: 16, 39: 17,
};

var MONSTER_TYPES = ["ball", "glider", "fireball", "bug", "paramecium", "tank", "walker", "teeth", "blob"];

/**
 * 2-character ID → internal numeric tile id (terrain / items / block).
 * Empty overlay uses "  " (two spaces).
 */
var CH = {
  "00": T.FLOOR,
  "99": T.WALL,
  "~~": T.WATER,
  "FF": T.FIRE,
  "II": T.ICE,
  "I1": T.ICE_NW,
  "I3": T.ICE_NE,
  "I7": T.ICE_SW,
  "I9": T.ICE_SE,
  "FN": T.FORCE_N,
  "FE": T.FORCE_E,
  "FS": T.FORCE_S,
  "FW": T.FORCE_W,
  "FR": T.FORCE_R,
  "DD": T.DIRT,
  "GG": T.GRAVEL,
  "EX": T.EXIT,
  "SX": T.SOCKET,
  "CH": T.CHIP,
  "??": T.HINT,
  "97": T.INVIS,
  "98": T.HIDDEN,
  "RR": T.RECESSED,
  "BR": T.BLUE_REAL,
  "BF": T.BLUE_FAKE,
  "TN": T.THIN_N,
  "TE": T.THIN_E,
  "TS": T.THIN_S,
  "TW": T.THIN_W,
  "TP": T.TELEPORT,
  "BM": T.BOMB,
  "TH": T.THIEF,
  "TR": T.TRAP,
  "VW": T.TOGGLE_WALL,
  "VF": T.TOGGLE_FLOOR,
  "CL": T.CLONER,
  "BG": T.BTN_GREEN,
  "RD": T.BTN_RED,
  "BB": T.BTN_BLUE,
  "BN": T.BTN_BROWN,
  "KB": T.KEY_B,
  "KR": T.KEY_R,
  "KG": T.KEY_G,
  "KY": T.KEY_Y,
  "LB": T.LOCK_B,
  "LR": T.LOCK_R,
  "LG": T.LOCK_G,
  "LY": T.LOCK_Y,
  "Bf": T.BOOT_FLIP,
  "Bi": T.BOOT_ICE,
  "Bs": T.BOOT_SUCTION,
  "By": T.BOOT_FIRE,
  "BK": T.BLOCK,
};

var MONSTER_CHARS = {
  "mb": { type: "ball", dir: DIR.E },
  "mB": { type: "ball", dir: DIR.S },
  "mg": { type: "glider", dir: DIR.E },
  "mf": { type: "fireball", dir: DIR.E },
  "mu": { type: "bug", dir: DIR.N },
  "mc": { type: "paramecium", dir: DIR.N },
  "mt": { type: "tank", dir: DIR.E },
  "mw": { type: "walker", dir: DIR.E },
  "me": { type: "teeth", dir: DIR.S },
  "mo": { type: "blob", dir: DIR.E },
};

var PLAYER_ID = "J0";

var TILE_LABELS = {
  "00": "Floor",
  "99": "Wall",
  "~~": "Water",
  "FF": "Fire",
  "II": "Ice",
  "I1": "Ice NW",
  "I3": "Ice NE",
  "I7": "Ice SW",
  "I9": "Ice SE",
  "FN": "Force N",
  "FE": "Force E",
  "FS": "Force S",
  "FW": "Force W",
  "FR": "Force Rand",
  "DD": "Dirt",
  "GG": "Gravel",
  "EX": "Exit",
  "SX": "Socket",
  "CH": "Chip",
  "??": "Hint",
  "97": "Invis wall",
  "98": "Hidden wall",
  "RR": "Recessed",
  "BR": "Blue wall",
  "BF": "Blue fake",
  "TN": "Thin N",
  "TE": "Thin E",
  "TS": "Thin S",
  "TW": "Thin W",
  "TP": "Teleport",
  "BM": "Bomb",
  "TH": "Thief",
  "TR": "Trap",
  "VW": "Toggle wall",
  "VF": "Toggle floor",
  "CL": "Cloner",
  "BG": "Btn green",
  "RD": "Btn red",
  "BB": "Btn blue",
  "BN": "Btn brown",
  "KB": "Key blue",
  "KR": "Key red",
  "KG": "Key green",
  "KY": "Key yellow",
  "LB": "Lock blue",
  "LR": "Lock red",
  "LG": "Lock green",
  "LY": "Lock yellow",
  "Bf": "Flippers",
  "Bi": "Ice skates",
  "Bs": "Suction",
  "By": "Fire boots",
  "BK": "Block",
  "mb": "Ball H",
  "mB": "Ball V",
  "mg": "Glider",
  "mf": "Fireball",
  "mu": "Bug",
  "mc": "Paramecium",
  "mt": "Tank",
  "mw": "Walker",
  "me": "Teeth",
  "mo": "Blob",
  "J0": "Player",
};

var ALL_CHARS = Object.keys(TILE_LABELS);

var ITEM_LAYER_CHARS = {
  "CH": true,
  "KB": true, "KR": true, "KG": true, "KY": true,
  "Bf": true, "Bi": true, "Bs": true, "By": true
};

function isItemLayerChar(id) {
  return !!ITEM_LAYER_CHARS[id];
}

function isBlockChar(id) {
  return id === "BK";
}

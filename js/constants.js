/**
 * Joe's Juke — tile IDs, directions, char maps, sprite indices
 */
"use strict";

var TILE = 32;

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

var CH = {
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

var MONSTER_CHARS = {
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

var TILE_LABELS = {
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
  "T": "Teeth", "x": "Blob",
  "A": "Player",
};

var ALL_CHARS = Object.keys(TILE_LABELS);

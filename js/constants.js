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

/**
 * Joe's Juke — monster IDs, labels, item-layer helpers
 */
"use strict";

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

/** Player start marker */
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

/** IDs that live on the item (overlay) layer — can sit under blocks. */
var ITEM_LAYER_CHARS = {
  "CH": true,
  "KB": true, "KR": true, "KG": true, "KY": true,
  "Bf": true, "Bi": true, "Bs": true, "By": true
};

/** True if palette ID is an item-layer tile (chip/key/boot). */
function isItemLayerChar(id) {
  return !!ITEM_LAYER_CHARS[id];
}

/** True if palette ID is a movable block. */
function isBlockChar(id) {
  return id === "BK";
}

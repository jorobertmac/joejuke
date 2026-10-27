/**
 * Joe's Juke — 2-char cell helpers + legacy migration
 */
"use strict";

/** Empty overlay cell marker (two spaces). Floor ID. */
var EMPTY_ID = "  ";
var FLOOR_ID = "00";

/**
 * Read a 2-char cell ID from a packed map/overlay row string at column x.
 * Also accepts array-of-ids rows.
 */
function cellId(row, x, emptyDefault) {
  if (row == null) return emptyDefault || FLOOR_ID;
  if (Array.isArray(row)) return row[x] || emptyDefault || FLOOR_ID;
  if (typeof row !== "string") return emptyDefault || FLOOR_ID;
  var i = x * 2;
  if (i + 2 > row.length) return emptyDefault || FLOOR_ID;
  return row.substr(i, 2);
}

/**
 * Write a 2-char ID into a packed row string at column x; returns new string.
 * Pads with fill (default floor) if the row is too short.
 */
function setCellId(row, x, id, cols, fill) {
  fill = fill || FLOOR_ID;
  id = (id && id.length === 2) ? id : fill;
  var s = row || "";
  var need = (cols != null ? cols : Math.max(x + 1, Math.ceil(s.length / 2))) * 2;
  while (s.length < need) s += fill;
  return s.substring(0, x * 2) + id + s.substring(x * 2 + 2);
}

/** Number of cells in a packed row string or id array. */
function rowCols(row) {
  if (!row) return 0;
  if (Array.isArray(row)) return row.length;
  return Math.floor(String(row).length / 2);
}

/**
 * Legacy single-char → new 2-char ID (for import of old levels).
 */
var LEGACY_CH = {
  ".": "00", "W": "99", "~": "~~", "F": "FF", "I": "II",
  "1": "I1", "3": "I3", "7": "I7", "9": "I9",
  "^": "FN", ">": "FE", "v": "FS", "<": "FW", "R": "FR",
  "D": "DD", "G": "GG",
  "E": "EX", "X": "SX", "C": "CH", "?": "??",
  "i": "97", "h": "98", "r": "RR",
  "[": "BR", "]": "BF",
  "N": "TN", "Y": "TE", "H": "TS", "Z": "TW",
  "@": "TP", "*": "BM", "$": "TH", "=": "TR",
  "|": "VW", "_": "VF", "+": "CL",
  "!": "BG", "#": "RD", "%": "BB", "&": "BN",
  "2": "KB", "4": "KR", "6": "KG", "8": "KY",
  "(": "LB", ")": "LR", "{": "LG", "}": "LY",
  "f": "Bf", "j": "Bi", "q": "Bs", "l": "By",
  "B": "BK",
  "p": "mb", "P": "mB", "m": "mg", "z": "mf",
  "a": "mu", "c": "mc", "t": "mt", "k": "mw",
  "T": "me", "x": "mo",
  "A": "J0"
};

/** Convert a legacy single-char map row string to packed 2-char form. */
function migrateLegacyRow(row) {
  if (!row || typeof row !== "string") return "";
  // Already looks packed (even length and first two chars form a known id or empty)
  if (row.length >= 2 && row.length % 2 === 0) {
    var probe = row.substr(0, 2);
    if (CH[probe] !== undefined || MONSTER_CHARS[probe] || probe === PLAYER_ID || probe === EMPTY_ID || probe === FLOOR_ID) {
      return row;
    }
  }
  var out = "";
  for (var i = 0; i < row.length; i++) {
    var c = row[i];
    out += LEGACY_CH[c] || FLOOR_ID;
  }
  return out;
}

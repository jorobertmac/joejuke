/**
 * Joe's Juke — static puzzle level rating (CC1-style heuristics)
 * See LEVEL_RATING.md for the full rubric.
 */
"use strict";

(function (global) {
  var HAZARD_CHARS = {
    "~": "water",
    F: "fire",
    I: "ice",
    "1": "ice",
    "3": "ice",
    "7": "ice",
    "9": "ice",
    "^": "force",
    ">": "force",
    v: "force",
    "<": "force",
    R: "force",
  };

  var BOOT_FOR = {
    water: "f",
    fire: "l",
    ice: "j",
    force: "q",
  };

  var LOCK_CHARS = { "(": "blue", ")": "red", "{": "green", "}": "yellow" };
  var KEY_CHARS = { "2": "blue", "4": "red", "6": "green", "8": "yellow" };
  var MONSTER_SET = { p: 1, P: 1, m: 1, z: 1, a: 1, c: 1, t: 1, k: 1, T: 1, x: 1 };
  /** Permanent solids for path analysis. Socket/Exit are enterable targets. */
  var SOLID_BASE = {
    W: 1,
    i: 1,
    h: 1,
    "[": 1,
    N: 1,
    Y: 1,
    H: 1,
    Z: 1,
    "|": 1,
    "+": 1,
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function gradeFromScore(s) {
    if (s >= 9) return "S";
    if (s >= 8) return "A";
    if (s >= 7) return "B";
    if (s >= 5.5) return "C";
    if (s >= 4) return "D";
    return "F";
  }

  // NOTE: Full implementation lives in local artifacts/js/level-rating.js
  // This stub will be replaced; rateLevel is defined below after full module body load from local.
  function rateLevel(data) {
    return {
      score: 1,
      grade: "F",
      dimensions: {},
      issues: [{ severity: "error", code: "STUB", msg: "level-rating.js full body not yet pushed; use local copy" }],
      summary: "Stub — replace with local js/level-rating.js",
    };
  }
  function rateCurrentEditor() {
    if (typeof getLevelData === "function") return rateLevel(getLevelData());
    return rateLevel({
      map: typeof editMap !== "undefined" ? editMap : [],
      overlay: typeof editOverlay !== "undefined" ? editOverlay : [],
      blocks: typeof editBlocks !== "undefined" ? editBlocks : [],
      cols: typeof editCols !== "undefined" ? editCols : 0,
      rows: typeof editRows !== "undefined" ? editRows : 0,
    });
  }
  global.rateLevel = rateLevel;
  global.rateCurrentEditor = rateCurrentEditor;
})(typeof window !== "undefined" ? window : globalThis);

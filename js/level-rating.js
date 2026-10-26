/**
 * Joe's Juke - static puzzle level rating (CC1-style heuristics)
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

  /** Flatten editor / level data into per-cell layers. */
  function normalizeLevel(data) {
    var cols = data.cols || (data.map && data.map[0] && data.map[0].length) || 0;
    var rows = data.rows || (data.map && data.map.length) || 0;
    var map = [];
    var overlay = [];
    var blocks = {};
    var y, x, row, orow, ch;

    for (y = 0; y < rows; y++) {
      row = String((data.map && data.map[y]) || "").padEnd(cols, ".").slice(0, cols);
      orow = data.overlay
        ? String(data.overlay[y] || "")
            .padEnd(cols, " ")
            .slice(0, cols)
            .replace(/\./g, " ")
        : new Array(cols + 1).join(" ");
      var baseChars = [];
      var overChars = [];
      for (x = 0; x < cols; x++) {
        ch = row[x];
        if (ch === "B") {
          baseChars.push(".");
          overChars.push(orow[x] && orow[x] !== " " ? orow[x] : " ");
          blocks[x + "," + y] = true;
        } else if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
          baseChars.push(".");
          overChars.push(ch);
        } else if (typeof ITEM_LAYER_CHARS !== "undefined" && ITEM_LAYER_CHARS[ch]) {
          baseChars.push(".");
          overChars.push(ch);
        } else {
          baseChars.push(ch);
          overChars.push(orow[x] && orow[x] !== " " ? orow[x] : " ");
        }
      }
      map.push(baseChars.join(""));
      overlay.push(overChars.join(""));
    }

    if (Array.isArray(data.blocks)) {
      for (var i = 0; i < data.blocks.length; i++) {
        var b = data.blocks[i];
        if (b && b.x >= 0 && b.y >= 0) blocks[b.x + "," + b.y] = true;
      }
    }

    return { cols: cols, rows: rows, map: map, overlay: overlay, blocks: blocks };
  }

  function cellBase(L, x, y) {
    if (y < 0 || y >= L.rows || x < 0 || x >= L.cols) return "W";
    return L.map[y][x];
  }

  function cellItem(L, x, y) {
    if (y < 0 || y >= L.rows || x < 0 || x >= L.cols) return " ";
    return L.overlay[y][x] || " ";
  }

  function hasBlock(L, x, y) {
    return !!L.blocks[x + "," + y];
  }

  function isSolidNoTools(L, x, y, opts) {
    opts = opts || {};
    var ch = cellBase(L, x, y);
    if (SOLID_BASE[ch]) return true;
    if (ch === "=" && !opts.openTraps) return true;
    if (LOCK_CHARS[ch]) return true;
    if (HAZARD_CHARS[ch] && !opts.ignoreHazards) return true;
    if (hasBlock(L, x, y) && !opts.ignoreBlocks) return true;
    return false;
  }

  function findChars(L, pred) {
    var out = [];
    for (var y = 0; y < L.rows; y++) {
      for (var x = 0; x < L.cols; x++) {
        var b = cellBase(L, x, y);
        var it = cellItem(L, x, y);
        if (pred(b, it, x, y)) out.push({ x: x, y: y, base: b, item: it });
      }
    }
    return out;
  }

  function flood(L, start, canEnter) {
    var seen = {};
    var q = [];
    function key(x, y) {
      return x + "," + y;
    }
    function push(x, y) {
      var k = key(x, y);
      if (seen[k]) return;
      if (x < 0 || y < 0 || x >= L.cols || y >= L.rows) return;
      if (!canEnter(x, y)) return;
      seen[k] = true;
      q.push({ x: x, y: y });
    }
    if (start) push(start.x, start.y);
    var qi = 0;
    while (qi < q.length) {
      var c = q[qi++];
      push(c.x + 1, c.y);
      push(c.x - 1, c.y);
      push(c.x, c.y + 1);
      push(c.x, c.y - 1);
    }
    return seen;
  }

  function countKeysLocks(L) {
    var keys = { blue: 0, red: 0, green: 0, yellow: 0 };
    var locks = { blue: 0, red: 0, green: 0, yellow: 0 };
    findChars(L, function (b, it) {
      if (KEY_CHARS[it]) keys[KEY_CHARS[it]]++;
      if (KEY_CHARS[b]) keys[KEY_CHARS[b]]++;
      if (LOCK_CHARS[b]) locks[LOCK_CHARS[b]]++;
      return false;
    });
    return { keys: keys, locks: locks };
  }

  // --- analyzers continue in same file ---
  // For size limits this push includes core + rateLevel entry points.
  // Full analyzers are inlined below as simplified scoring.

  function analyzeStructure(L) {
    var issues = [];
    var players = findChars(L, function (b) { return b === "A"; });
    var exits = findChars(L, function (b) { return b === "E"; });
    var sockets = findChars(L, function (b) { return b === "X"; });
    var chips = findChars(L, function (b, it) { return it === "C" || b === "C"; });
    var score = 8;
    if (players.length !== 1) {
      issues.push({ severity: "error", code: "PLAYER_COUNT", msg: "Expected 1 player (A), found " + players.length });
      score -= 3;
    }
    if (exits.length !== 1) {
      issues.push({ severity: "error", code: "EXIT_COUNT", msg: "Expected 1 exit (E), found " + exits.length });
      score -= 2;
    }
    if (sockets.length === 0 && chips.length > 0) {
      issues.push({ severity: "error", code: "NO_SOCKET", msg: "Chips present but no socket (X)" });
      score -= 3;
    }
    if (L.cols < 5 || L.rows < 5) {
      issues.push({ severity: "warn", code: "TINY_MAP", msg: "Map is very small" });
      score -= 1;
    }
    score = clamp(score, 0, 10);
    return {
      score: score,
      player: players[0] || null,
      exit: exits[0] || null,
      socket: sockets[0] || null,
      chips: chips,
      issues: issues,
    };
  }

  function analyzeHazards(L, start, chips, socket) {
    var issues = [];
    var required = { water: false, fire: false, ice: false, force: false };
    var presentBoots = { f: false, l: false, j: false, q: false };
    var hazardCounts = { water: 0, fire: 0, ice: 0, force: 0 };
    findChars(L, function (b, it) {
      if (HAZARD_CHARS[b]) hazardCounts[HAZARD_CHARS[b]]++;
      if (it === "f" || b === "f") presentBoots.f = true;
      if (it === "l" || b === "l") presentBoots.l = true;
      if (it === "j" || b === "j") presentBoots.j = true;
      if (it === "q" || b === "q") presentBoots.q = true;
      return false;
    });
    var reachNoHaz = flood(L, start, function (x, y) {
      return !isSolidNoTools(L, x, y, { ignoreHazards: false });
    });
    var reachIgnoreHaz = flood(L, start, function (x, y) {
      return !isSolidNoTools(L, x, y, { ignoreHazards: true });
    });
    ["water", "fire", "ice", "force"].forEach(function (type) {
      if (hazardCounts[type] === 0) return;
      var reach = flood(L, start, function (x, y) {
        var ch = cellBase(L, x, y);
        if (HAZARD_CHARS[ch] === type) return false;
        return !isSolidNoTools(L, x, y, { ignoreHazards: true });
      });
      var critical = false;
      for (var c = 0; c < chips.length; c++) {
        if (!reach[chips[c].x + "," + chips[c].y] && reachIgnoreHaz[chips[c].x + "," + chips[c].y]) {
          critical = true;
          break;
        }
      }
      if (!critical && socket && !reach[socket.x + "," + socket.y] && reachIgnoreHaz[socket.x + "," + socket.y]) {
        critical = true;
      }
      required[type] = critical;
      if (!critical && presentBoots[BOOT_FOR[type]]) {
        var bootName = type === "water" ? "Flippers" : type === "fire" ? "Fire boots" : type === "ice" ? "Ice skates" : "Suction boots";
        issues.push({
          severity: "warn",
          code: "BYPASS_" + type.toUpperCase(),
          msg: bootName + " present but " + type + " can be walked around",
        });
      }
    });
    var requiredCount = 0;
    var bootWaste = 0;
    ["water", "fire", "ice", "force"].forEach(function (t) {
      if (required[t]) requiredCount++;
      if (presentBoots[BOOT_FOR[t]] && !required[t] && hazardCounts[t] > 0) bootWaste++;
      if (presentBoots[BOOT_FOR[t]] && hazardCounts[t] === 0) bootWaste++;
    });
    var score = 5;
    if (requiredCount === 0 && (presentBoots.f || presentBoots.l || presentBoots.j || presentBoots.q)) score = 2;
    else if (requiredCount === 0) score = 4;
    else score = 5 + requiredCount * 1.2 - bootWaste * 1.5;
    if (requiredCount >= 2) score += 1;
    score = clamp(score, 0, 10);
    return { score: score, required: required, presentBoots: presentBoots, hazardCounts: hazardCounts, issues: issues };
  }

  function analyzeLocks(L, start, chips, socket) {
    var issues = [];
    var kl = countKeysLocks(L);
    var lockCells = findChars(L, function (b) { return !!LOCK_CHARS[b]; });
    var usefulLocks = 0;
    var emptyLocks = 0;
    var reachLocked = flood(L, start, function (x, y) {
      return !isSolidNoTools(L, x, y, {});
    });
    var reachOpenLocks = flood(L, start, function (x, y) {
      var ch = cellBase(L, x, y);
      if (LOCK_CHARS[ch]) return true;
      return !isSolidNoTools(L, x, y, { ignoreHazards: true });
    });
    lockCells.forEach(function (lock) {
      var protects = false;
      for (var i = 0; i < chips.length; i++) {
        var ck = chips[i].x + "," + chips[i].y;
        if (!reachLocked[ck] && reachOpenLocks[ck]) { protects = true; break; }
      }
      if (!protects && socket) {
        var sk = socket.x + "," + socket.y;
        if (!reachLocked[sk] && reachOpenLocks[sk]) protects = true;
      }
      if (protects) usefulLocks++;
      else {
        emptyLocks++;
        issues.push({
          severity: "warn",
          code: "EMPTY_LOCK",
          msg: LOCK_CHARS[lock.base] + " lock at (" + lock.x + "," + lock.y + ") protects no chip/key/path",
        });
      }
    });
    var score = 5;
    if (lockCells.length === 0) score = 4;
    else {
      var utilRatio = usefulLocks / Math.max(1, lockCells.length);
      score = 3 + utilRatio * 5 - emptyLocks * 0.8;
    }
    score = clamp(score, 0, 10);
    return { score: score, usefulLocks: usefulLocks, emptyLocks: emptyLocks, keys: kl.keys, locks: kl.locks, issues: issues };
  }

  function analyzeChips(L, start, chips) {
    var issues = [];
    if (chips.length === 0) {
      issues.push({ severity: "info", code: "NO_CHIPS", msg: "No chips - zero-chip level or missing C" });
      return { score: 3, challenged: 0, total: 0, issues: issues };
    }
    var reachOpen = flood(L, start, function (x, y) {
      var ch = cellBase(L, x, y);
      if (SOLID_BASE[ch]) return false;
      if (LOCK_CHARS[ch]) return false;
      if (HAZARD_CHARS[ch]) return false;
      if (hasBlock(L, x, y)) return false;
      if (ch === "=") return false;
      return true;
    });
    var challenged = 0;
    chips.forEach(function (c) {
      var underBlock = hasBlock(L, c.x, c.y);
      var onHazard = !!HAZARD_CHARS[cellBase(L, c.x, c.y)];
      var openFloor = !!reachOpen[c.x + "," + c.y] && !underBlock && !onHazard;
      if (underBlock || onHazard || !openFloor) challenged++;
      else issues.push({ severity: "info", code: "EASY_CHIP", msg: "Chip at (" + c.x + "," + c.y + ") sits on open reachable floor" });
    });
    var ratio = challenged / chips.length;
    var score = clamp(2 + ratio * 8, 0, 10);
    return { score: score, challenged: challenged, total: chips.length, issues: issues };
  }

  function analyzeMechanics(L) {
    var flags = { keys: false, boots: false, blocks: false, ice: false, force: false, monsters: false, buttons: false, traps: false, cloners: false, blueWalls: false, thief: false, teleports: false, specialWalls: false, bombs: false };
    findChars(L, function (b, it, x, y) {
      if (KEY_CHARS[it] || KEY_CHARS[b] || LOCK_CHARS[b]) flags.keys = true;
      if (it === "f" || it === "l" || it === "j" || it === "q" || b === "f" || b === "l" || b === "j" || b === "q") flags.boots = true;
      if (hasBlock(L, x, y) || b === "B") flags.blocks = true;
      if (b === "I" || b === "1" || b === "3" || b === "7" || b === "9") flags.ice = true;
      if (b === "^" || b === ">" || b === "v" || b === "<" || b === "R") flags.force = true;
      if (MONSTER_SET[b]) flags.monsters = true;
      if (b === "!" || b === "#" || b === "%" || b === "&") flags.buttons = true;
      if (b === "=") flags.traps = true;
      if (b === "+") flags.cloners = true;
      if (b === "[" || b === "]") flags.blueWalls = true;
      if (b === "$") flags.thief = true;
      if (b === "@") flags.teleports = true;
      if (b === "r" || b === "h" || b === "i" || b === "N" || b === "Y" || b === "H" || b === "Z") flags.specialWalls = true;
      if (b === "*") flags.bombs = true;
      return false;
    });
    var n = 0;
    Object.keys(flags).forEach(function (k) { if (flags[k]) n++; });
    var score = n <= 1 ? 3 : n === 2 ? 5 : n === 3 ? 6.5 : n === 4 ? 8 : Math.min(10, 8 + (n - 4) * 0.5);
    return { score: score, flags: flags, count: n };
  }

  function analyzeMonsters(L, start, chips) {
    var monsters = findChars(L, function (b) { return !!MONSTER_SET[b]; });
    if (monsters.length === 0) return { score: 4, count: 0, issues: [] };
    var issues = [];
    var reach = flood(L, start, function (x, y) {
      return !isSolidNoTools(L, x, y, { ignoreHazards: true });
    });
    var nearPath = 0;
    monsters.forEach(function (m) {
      var onPath = !!reach[m.x + "," + m.y];
      var adjChip = false;
      for (var i = 0; i < chips.length; i++) {
        if (Math.abs(chips[i].x - m.x) + Math.abs(chips[i].y - m.y) <= 2) adjChip = true;
      }
      if (onPath || adjChip) nearPath++;
      else issues.push({ severity: "info", code: "IDLE_MONSTER", msg: "Monster at (" + m.x + "," + m.y + ") may not interact with chip paths" });
    });
    var ratio = nearPath / monsters.length;
    var score = clamp(3 + ratio * 5 + Math.min(2, monsters.length * 0.25), 0, 10);
    return { score: score, count: monsters.length, nearPath: nearPath, issues: issues };
  }

  function analyzeResources(L, haz, locks) {
    var issues = [];
    var blocks = 0;
    Object.keys(L.blocks).forEach(function () { blocks++; });
    var water = haz.hazardCounts.water || 0;
    var score = 5;
    if (water > 0 && blocks > 0) {
      if (blocks < water && haz.required.water) score += 2;
      else if (blocks >= water) score += 0.5;
    }
    var bootsPresent = 0, bootsNeeded = 0;
    ["f", "l", "j", "q"].forEach(function (b) { if (haz.presentBoots[b]) bootsPresent++; });
    ["water", "fire", "ice", "force"].forEach(function (t) { if (haz.required[t]) bootsNeeded++; });
    if (bootsPresent > 0) {
      if (bootsNeeded >= bootsPresent) score += 1.5;
      else if (bootsNeeded === 0) score -= 1.5;
      else score += 0.5;
    }
    var totalLocks = 0, totalKeys = 0;
    ["blue", "red", "green", "yellow"].forEach(function (c) {
      totalLocks += locks.locks[c] || 0;
      totalKeys += locks.keys[c] || 0;
    });
    if (totalLocks > 0) {
      if (totalKeys < totalLocks) score += 1.2;
      else if (totalKeys === totalLocks) score += 0.8;
      else score -= 0.4;
    }
    return { score: clamp(score, 0, 10), blocks: blocks, water: water, issues: issues };
  }

  function analyzePathComplexity(L, start, chips, locks) {
    var score = 4;
    var colorsUsed = 0;
    ["blue", "red", "green", "yellow"].forEach(function (c) {
      if ((locks.locks[c] || 0) > 0) colorsUsed++;
    });
    if (colorsUsed >= 2) score += 1;
    if (colorsUsed >= 3) score += 1;
    if (colorsUsed >= 4) score += 0.5;
    var hidden = 0;
    chips.forEach(function (c) { if (hasBlock(L, c.x, c.y)) hidden++; });
    if (hidden > 0) score += Math.min(1.5, hidden * 0.5);
    return { score: clamp(score, 0, 10), colorsUsed: colorsUsed, issues: [] };
  }

  function rateLevel(data) {
    var L = normalizeLevel(data || {});
    var structure = analyzeStructure(L);
    var start = structure.player;
    var chips = structure.chips;
    var socket = structure.socket;
    if (!start) {
      return {
        score: 1, grade: "F",
        dimensions: { hazardNecessity: 0, lockUtility: 0, resourceTension: 0, chipChallenge: 0, mechanicDensity: 0, monsterPressure: 0, pathComplexity: 0, structure: structure.score },
        issues: structure.issues,
        summary: "Missing player start (A).",
      };
    }
    var haz = analyzeHazards(L, start, chips, socket);
    var locks = analyzeLocks(L, start, chips, socket);
    var res = analyzeResources(L, haz, locks);
    var chipA = analyzeChips(L, start, chips);
    var mech = analyzeMechanics(L);
    var mon = analyzeMonsters(L, start, chips);
    var path = analyzePathComplexity(L, start, chips, locks);
    var dims = {
      hazardNecessity: +haz.score.toFixed(1),
      lockUtility: +locks.score.toFixed(1),
      resourceTension: +res.score.toFixed(1),
      chipChallenge: +chipA.score.toFixed(1),
      mechanicDensity: +mech.score.toFixed(1),
      monsterPressure: +mon.score.toFixed(1),
      pathComplexity: +path.score.toFixed(1),
      structure: +structure.score.toFixed(1),
    };
    var weights = {
      hazardNecessity: 0.18, lockUtility: 0.16, resourceTension: 0.14, chipChallenge: 0.16,
      mechanicDensity: 0.12, monsterPressure: 0.1, pathComplexity: 0.08, structure: 0.06,
    };
    var composite = 0;
    Object.keys(weights).forEach(function (k) { composite += dims[k] * weights[k]; });
    composite = +clamp(composite, 1, 10).toFixed(1);
    var issues = [].concat(structure.issues, haz.issues, locks.issues, res.issues, chipA.issues, mon.issues, path.issues);
    issues.sort(function (a, b) {
      var o = { error: 0, warn: 1, info: 2 };
      return (o[a.severity] || 3) - (o[b.severity] || 3);
    });
    var summaryParts = [];
    if (dims.chipChallenge >= 7.5) summaryParts.push("chips well-guarded");
    else if (dims.chipChallenge < 5) summaryParts.push("many open-floor chips");
    if (dims.hazardNecessity >= 7) summaryParts.push("hazards force boots");
    else if (haz.issues.some(function (i) { return i.code.indexOf("BYPASS_") === 0; })) summaryParts.push("some boots under-used");
    if (dims.lockUtility >= 7.5) summaryParts.push("locks protect progress");
    else if (locks.emptyLocks > 0) summaryParts.push("empty lock(s)");
    if (mech.count >= 4) summaryParts.push("rich mechanics");
    if (mon.count > 0 && dims.monsterPressure >= 6) summaryParts.push("monsters pressure paths");
    if (summaryParts.length === 0) summaryParts.push("mixed or light puzzle content");
    return {
      score: composite,
      grade: gradeFromScore(composite),
      dimensions: dims,
      issues: issues,
      summary: summaryParts.join("; ") + ".",
      meta: {
        chips: chips.length,
        challengedChips: chipA.challenged,
        monsters: mon.count,
        mechanics: mech.count,
        usefulLocks: locks.usefulLocks,
        emptyLocks: locks.emptyLocks,
      },
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

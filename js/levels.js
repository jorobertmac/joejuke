/**
 * Joe's Juke — level pack loader
 * Loads levels/manifest.json then each levels/*.json file.
 * Builds global LEVELS (full objects) and LEVEL_NAMES (titles).
 */
"use strict";

var LEVELS = [];
var LEVEL_NAMES = [];
var LEVEL_PACK = null;
var levelsReady = null;

function levelBasePath() {
  try {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("levels.js") !== -1) {
        return src.replace(/js\/levels\.js(\?.*)?$/, "levels/");
      }
    }
  } catch (e) {}
  return "levels/";
}

function fetchJson(url) {
  return fetch(url, { cache: "no-cache" }).then(function (res) {
    if (!res.ok) throw new Error("Failed to load " + url + " (" + res.status + ")");
    return res.json();
  });
}

/**
 * Normalize a level JSON into the shape parseLevel expects, preserving metadata.
 */
function normalizePackLevel(raw, index) {
  if (!raw || typeof raw !== "object") {
    return { map: [], title: "Level " + (index + 1), number: index + 1 };
  }
  var map = raw.map || raw.rows || [];
  if (!Array.isArray(map)) map = [];
  var out = {
    id: raw.id || ("level-" + (index + 1)),
    number: typeof raw.number === "number" ? raw.number : index + 1,
    title: raw.title || raw.name || ("Level " + (index + 1)),
    author: raw.author || "",
    timeLimit: typeof raw.timeLimit === "number" ? raw.timeLimit : 0,
    chipsRequired: raw.chipsRequired != null ? raw.chipsRequired : null,
    maxMoves: typeof raw.maxMoves === "number" ? raw.maxMoves : 0,
    password: raw.password || null,
    hint: raw.hint || "",
    map: map,
  };
  if (raw.overlay && Array.isArray(raw.overlay)) out.overlay = raw.overlay;
  if (raw.blocks && Array.isArray(raw.blocks)) out.blocks = raw.blocks;
  return out;
}

function applyLevelPack(pack, levelObjs) {
  LEVEL_PACK = pack || { name: "Campaign", version: 1, levels: [] };
  LEVELS = levelObjs;
  LEVEL_NAMES = levelObjs.map(function (lv, i) {
    return lv.title || ("Level " + (i + 1));
  });
  if (typeof fillLevelSelects === "function") fillLevelSelects();
  if (typeof levelTotalEl !== "undefined" && levelTotalEl) {
    levelTotalEl.textContent = String(LEVELS.length);
  }
}

/**
 * Load campaign from levels/manifest.json + per-level JSON files.
 * Returns a Promise that resolves when LEVELS is populated.
 */
function loadLevelPack() {
  var base = levelBasePath();
  levelsReady = fetchJson(base + "manifest.json")
    .then(function (pack) {
      var list = (pack && pack.levels) || [];
      if (!list.length) throw new Error("Level manifest is empty");
      return Promise.all(
        list.map(function (entry, i) {
          var file = entry.file || entry.id + ".json";
          return fetchJson(base + file).then(function (raw) {
            var lv = normalizePackLevel(raw, i);
            if (entry.title && !raw.title) lv.title = entry.title;
            if (entry.number != null) lv.number = entry.number;
            return lv;
          });
        })
      ).then(function (objs) {
        applyLevelPack(pack, objs);
        return objs;
      });
    })
    .catch(function (err) {
      console.error("Level pack load failed:", err);
      LEVELS = [];
      LEVEL_NAMES = [];
      var el = document.getElementById("loadError");
      if (el) {
        el.classList.remove("hidden");
        el.textContent =
          "Could not load levels from levels/. Serve over HTTP and ensure levels/manifest.json exists. " +
          (err && err.message ? err.message : "");
      }
      throw err;
    });
  return levelsReady;
}

// Kick off load immediately when the script runs
loadLevelPack();

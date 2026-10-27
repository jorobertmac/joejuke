/**
 * Joe's Juke — import/export level JSON (supports layered overlay + blocks)
 * Import sources: built-in game levels, pasted JSON, or loaded .json file.
 */
"use strict";

/* LEVEL_NAMES is filled by js/levels.js from levels/manifest.json */
if (typeof LEVEL_NAMES === "undefined") var LEVEL_NAMES = [];

/**
 * Convert a LEVELS entry (string[] or {map,overlay?,blocks?}) into editor-ready data.
 */
function levelToImportData(raw, index) {
  var name = (typeof LEVEL_NAMES !== "undefined" && LEVEL_NAMES[index])
    ? LEVEL_NAMES[index]
    : ("Level " + (index + 1));
  if (!raw) {
    return { name: name, cols: 20, rows: 15, map: [], version: 1 };
  }
  if (Array.isArray(raw)) {
    var cols = raw[0] ? raw[0].length : 20;
    return {
      name: name,
      cols: cols,
      rows: raw.length,
      map: raw.map(function (r) { return String(r); }),
      version: 1
    };
  }
  var map = raw.map || [];
  var cols2 = raw.cols || (map[0] && map[0].length) || 20;
  var rows2 = raw.rows || map.length || 15;
  var result = {
    name: raw.title || raw.name || name,
    title: raw.title || raw.name || name,
    cols: cols2,
    rows: rows2,
    map: map.map(function (r) { return String(r).padEnd(cols2, ".").slice(0, cols2); }),
    version: raw.version || 4,
    timeLimit: typeof raw.timeLimit === "number" ? raw.timeLimit : 0,
    chipsRequired: raw.chipsRequired != null ? raw.chipsRequired : null,
    maxMoves: typeof raw.maxMoves === "number" ? raw.maxMoves : 0,
    password: raw.password || null,
    hint: raw.hint || "",
    author: raw.author || ""
  };
  if (raw.overlay && Array.isArray(raw.overlay)) {
    result.overlay = raw.overlay.map(function (r) {
      return String(r).padEnd(cols2, " ").slice(0, cols2).replace(/\./g, " ");
    });
  }
  if (raw.blocks && Array.isArray(raw.blocks)) {
    result.blocks = raw.blocks
      .filter(function (b) { return b && typeof b.x === "number" && typeof b.y === "number"; })
      .map(function (b) { return { x: b.x, y: b.y }; });
  }
  return result;
}

/**
 * Parse pasted/file text into a single level object, or an array of level objects.
 * Returns { single: data } or { list: [data, ...] }.
 */
function parseImportFlexible(text) {
  text = (text || "").trim();
  if (!text) throw new Error("Empty");

  try {
    var obj = JSON.parse(text);

    // Top-level array of map strings (legacy single level)
    if (Array.isArray(obj) && obj.length && typeof obj[0] === "string") {
      var colsA = obj[0].length;
      return {
        single: {
          name: "Imported",
          cols: colsA,
          rows: obj.length,
          map: obj.map(function (r) { return String(r).padEnd(colsA, ".").slice(0, colsA); }),
          version: 1
        }
      };
    }

    // Top-level array of level objects / mixed
    if (Array.isArray(obj) && obj.length) {
      var list = obj.map(function (item, i) {
        return levelToImportData(item, i);
      });
      if (list.length === 1) return { single: list[0] };
      return { list: list };
    }

    // { levels: [...] } pack
    if (obj && Array.isArray(obj.levels) && obj.levels.length) {
      var pack = obj.levels.map(function (item, i) {
        return levelToImportData(item, i);
      });
      if (pack.length === 1) return { single: pack[0] };
      return { list: pack };
    }

    // Single level object with map
    if (obj && obj.map && Array.isArray(obj.map)) {
      var cols = obj.cols || obj.map[0].length;
      var rows = obj.rows || obj.map.length;
      var result = {
        name: obj.name || obj.title || "Imported",
        title: obj.title || obj.name || "Imported",
        cols: cols,
        rows: rows,
        map: obj.map.map(function (r) { return String(r).padEnd(cols, ".").slice(0, cols); }),
        version: obj.version || 4,
        timeLimit: typeof obj.timeLimit === "number" ? obj.timeLimit : 0,
        chipsRequired: obj.chipsRequired != null ? obj.chipsRequired : null,
        maxMoves: typeof obj.maxMoves === "number" ? obj.maxMoves : 0,
        password: obj.password || null,
        hint: obj.hint || "",
        author: obj.author || ""
      };
      if (obj.overlay && Array.isArray(obj.overlay)) {
        result.overlay = obj.overlay.map(function (r) {
          return String(r).padEnd(cols, " ").slice(0, cols).replace(/\./g, " ");
        });
        while (result.overlay.length < rows) result.overlay.push(new Array(cols + 1).join(" "));
        result.overlay.length = rows;
      }
      if (obj.blocks && Array.isArray(obj.blocks)) {
        result.blocks = obj.blocks
          .filter(function (b) { return b && typeof b.x === "number" && typeof b.y === "number"; })
          .map(function (b) { return { x: b.x, y: b.y }; });
      }
      return { single: result };
    }
  } catch (e) {
    if (e && e.message && e.message.indexOf("Empty") === 0) throw e;
    // fall through to plain-text map lines
  }

  var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  if (lines.length < 3) throw new Error("Bad format");
  var cols3 = Math.max.apply(null, lines.map(function (l) { return l.length; }));
  return {
    single: {
      name: "Imported",
      cols: cols3,
      rows: lines.length,
      map: lines.map(function (r) { return r.padEnd(cols3, ".").slice(0, cols3); }),
      version: 1
    }
  };
}

/** Legacy wrapper used by confirmImportBtn for single-level paste. */
function parseImport(text) {
  var parsed = parseImportFlexible(text);
  if (parsed.single) return parsed.single;
  if (parsed.list && parsed.list.length) return parsed.list[0];
  throw new Error("Bad format");
}

function applyImportedLevel(data) {
  if (document.body.classList.contains("editor-mode") || gameState === "editor") {
    if (typeof loadIntoEditor === "function") {
      loadIntoEditor(data);
    } else {
      editCols = data.cols;
      editRows = data.rows;
      editMap = data.map.slice();
    }
    COLS = editCols;
    ROWS = editRows;
    if (typeof resizeCanvas === "function") resizeCanvas();
    var colsInput = document.getElementById("editCols");
    var rowsInput = document.getElementById("editRows");
    if (colsInput) colsInput.value = editCols;
    if (rowsInput) rowsInput.value = editRows;
    hideAllScreens();
    if (editorBar) editorBar.classList.remove("hidden");
    gameState = "editor";
    document.body.classList.add("editor-mode");
    if (typeof updateLayerUI === "function") updateLayerUI();
    if (statusEl) statusEl.textContent = "Imported: " + (data.name || "level");
  } else {
    if (typeof loadCustomLevel === "function") loadCustomLevel(data, false);
  }
}

function populateBuiltinSelect() {
  var sel = document.getElementById("importBuiltinSelect");
  if (!sel || typeof LEVELS === "undefined") return;
  sel.innerHTML = "";
  var opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "— Choose a built-in level —";
  sel.appendChild(opt0);
  for (var i = 0; i < LEVELS.length; i++) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = (LEVEL_NAMES[i] || ("Level " + (i + 1)));
    sel.appendChild(opt);
  }
}

function populateJsonLevelSelect(list) {
  var wrap = document.getElementById("importJsonPickWrap");
  var sel = document.getElementById("importJsonLevelSelect");
  if (!wrap || !sel) return;
  sel.innerHTML = "";
  if (!list || !list.length) {
    wrap.classList.add("hidden");
    window._importJsonList = null;
    return;
  }
  window._importJsonList = list;
  for (var i = 0; i < list.length; i++) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = list[i].name || list[i].title || ("Level " + (i + 1));
    sel.appendChild(opt);
  }
  wrap.classList.remove("hidden");
}

function openImportModal() {
  hideAllScreens();
  if (importModal) importModal.classList.remove("hidden");
  var ta = document.getElementById("importText");
  if (ta) ta.value = "";
  var fileInput = document.getElementById("importFileInput");
  if (fileInput) fileInput.value = "";
  populateBuiltinSelect();
  populateJsonLevelSelect(null);
  var errEl = document.getElementById("importError");
  if (errEl) {
    errEl.textContent = "";
    errEl.classList.add("hidden");
  }
}

function setImportError(msg, isInfo) {
  var errEl = document.getElementById("importError");
  if (errEl) {
    errEl.textContent = msg || "";
    if (msg) errEl.classList.remove("hidden");
    else errEl.classList.add("hidden");
    errEl.style.color = isInfo ? "#fde68a" : "";
  }
  if (statusEl && msg) {
    statusEl.textContent = isInfo ? msg : ("Import failed: " + msg);
  }
}

/* ---- Built-in level load ---- */
var loadBuiltinBtn = document.getElementById("loadBuiltinBtn");
if (loadBuiltinBtn) loadBuiltinBtn.addEventListener("click", function () {
  var sel = document.getElementById("importBuiltinSelect");
  if (!sel || sel.value === "") {
    setImportError("Select a built-in level first");
    return;
  }
  var idx = parseInt(sel.value, 10);
  if (isNaN(idx) || typeof LEVELS === "undefined" || !LEVELS[idx]) {
    setImportError("Invalid level");
    return;
  }
  try {
    var data = levelToImportData(LEVELS[idx], idx);
    applyImportedLevel(data);
    setImportError("");
  } catch (err) {
    setImportError(err.message || "bad level");
  }
});

/* ---- Paste / file JSON load ---- */
document.getElementById("confirmImportBtn").addEventListener("click", function () {
  try {
    var text = document.getElementById("importText").value;
    var parsed = parseImportFlexible(text);

    // Multi-level pack: show picker; user loads via "Load selected"
    if (parsed.list && parsed.list.length > 1) {
      populateJsonLevelSelect(parsed.list);
      var jsel = document.getElementById("importJsonLevelSelect");
      if (jsel) jsel.value = "0";
      setImportError("JSON has " + parsed.list.length + " levels — pick one, then Load selected", true);
      return;
    }

    var data = parsed.single || (parsed.list && parsed.list[0]);
    if (!data) throw new Error("No level found");
    applyImportedLevel(data);
    setImportError("");
    populateJsonLevelSelect(null);
  } catch (err) {
    setImportError(err.message || "bad");
  }
});

/* Load selected level from multi-level JSON pack */
var loadJsonPickBtn = document.getElementById("loadJsonPickBtn");
if (loadJsonPickBtn) {
  loadJsonPickBtn.addEventListener("click", function () {
    var jsel = document.getElementById("importJsonLevelSelect");
    if (!jsel || !window._importJsonList) {
      setImportError("No multi-level JSON loaded");
      return;
    }
    var pick = window._importJsonList[parseInt(jsel.value, 10)];
    if (!pick) {
      setImportError("Select a level from the list");
      return;
    }
    try {
      applyImportedLevel(pick);
      setImportError("");
      populateJsonLevelSelect(null);
    } catch (err) {
      setImportError(err.message || "bad");
    }
  });
}

/* File input: read .json into textarea (and auto-parse if single) */
var importFileInput = document.getElementById("importFileInput");
if (importFileInput) {
  importFileInput.addEventListener("change", function () {
    var file = importFileInput.files && importFileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var text = String(reader.result || "");
      var ta = document.getElementById("importText");
      if (ta) ta.value = text;
      try {
        var parsed = parseImportFlexible(text);
        if (parsed.list && parsed.list.length > 1) {
          populateJsonLevelSelect(parsed.list);
          setImportError("File has " + parsed.list.length + " levels — pick one, then Load selected", true);
        } else {
          populateJsonLevelSelect(null);
          setImportError("");
          if (statusEl) statusEl.textContent = "File loaded — click Load";
        }
      } catch (err) {
        setImportError(err.message || "Could not parse file");
      }
    };
    reader.onerror = function () {
      setImportError("Could not read file");
    };
    reader.readAsText(file);
  });
}

function returnToEditor() {
  if (customLevel) {
    if (typeof loadIntoEditor === "function") {
      loadIntoEditor(customLevel);
    } else {
      editCols = customLevel.cols;
      editRows = customLevel.rows;
      editMap = customLevel.map.slice();
    }
  }
  enterEditor();
}
backToEditorBtn.addEventListener("click", returnToEditor);
backToEditorWinBtn.addEventListener("click", returnToEditor);

var importStartBtn = document.getElementById("importStartBtn");
if (importStartBtn) {
  importStartBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openImportModal();
  });
}

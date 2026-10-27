/**
 * Rebind levelToImportData for packed 2-char IDs (pad with FLOOR_ID / EMPTY_ID).
 */
"use strict";

(function () {
  function levelToImportData2(raw, index) {
    var name = (typeof LEVEL_NAMES !== "undefined" && LEVEL_NAMES[index])
      ? LEVEL_NAMES[index]
      : ("Level " + (index + 1));
    if (!raw) {
      return { name: name, cols: 20, rows: 15, map: [], version: 1 };
    }
    if (Array.isArray(raw)) {
      var mapped = raw.map(function (r) {
        return (typeof migrateLegacyRow === "function") ? migrateLegacyRow(String(r)) : String(r);
      });
      var cols = mapped[0] ? rowCols(mapped[0]) : 20;
      return {
        name: name,
        cols: cols,
        rows: mapped.length,
        map: mapped,
        version: 1
      };
    }
    var map = raw.map || [];
    var mapped2 = map.map(function (r) {
      return (typeof migrateLegacyRow === "function") ? migrateLegacyRow(String(r)) : String(r);
    });
    var cols2 = raw.cols || (mapped2[0] ? rowCols(mapped2[0]) : 20);
    var rows2 = raw.rows || mapped2.length || 15;
    mapped2 = mapped2.map(function (r) {
      var need = cols2 * 2;
      while (r.length < need) r += FLOOR_ID;
      return r.slice(0, need);
    });
    var result = {
      name: raw.title || raw.name || name,
      title: raw.title || raw.name || name,
      cols: cols2,
      rows: rows2,
      map: mapped2,
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
        var s = (typeof migrateLegacyRow === "function" && String(r).length === cols2)
          ? migrateLegacyRow(String(r)) : String(r);
        var need = cols2 * 2;
        while (s.length < need) s += EMPTY_ID;
        return s.slice(0, need);
      });
    }
    if (raw.blocks && Array.isArray(raw.blocks)) {
      result.blocks = raw.blocks
        .filter(function (b) { return b && typeof b.x === "number" && typeof b.y === "number"; })
        .map(function (b) { return { x: b.x, y: b.y }; });
    }
    return result;
  }

  function wire() {
    if (typeof levelToImportData === "function") {
      levelToImportData = levelToImportData2;
    } else {
      window.levelToImportData = levelToImportData2;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);
})();

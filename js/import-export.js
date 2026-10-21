/**
 * Joe's Juke — import/export level JSON
 */
"use strict";

function parseImport(text) {
  text = text.trim();
  if (!text) throw new Error("Empty");
  try {
    var obj = JSON.parse(text);
    if (obj.map && Array.isArray(obj.map)) {
      var cols = obj.cols || obj.map[0].length;
      var rows = obj.rows || obj.map.length;
      return { name: obj.name || "Imported", cols: cols, rows: rows, map: obj.map.map(function (r) { return String(r).padEnd(cols, ".").slice(0, cols); }), version: obj.version || 1 };
    }
    if (Array.isArray(obj)) {
      var cols2 = obj[0].length;
      return { name: "Imported", cols: cols2, rows: obj.length, map: obj.map(function (r) { return String(r).padEnd(cols2, ".").slice(0, cols2); }), version: 1 };
    }
  } catch (_) {}
  var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  if (lines.length < 3) throw new Error("Bad format");
  var cols3 = Math.max.apply(null, lines.map(function (l) { return l.length; }));
  return { name: "Imported", cols: cols3, rows: lines.length, map: lines.map(function (r) { return r.padEnd(cols3, ".").slice(0, cols3); }), version: 1 };
}

document.getElementById("confirmImportBtn").addEventListener("click", function () {
  try {
    var data = parseImport(document.getElementById("importText").value);
    if (document.body.classList.contains("editor-mode") || gameState === "editor") {
      editCols = data.cols; editRows = data.rows; editMap = data.map.slice();
      COLS = editCols; ROWS = editRows; resizeCanvas();
      document.getElementById("editCols").value = editCols;
      document.getElementById("editRows").value = editRows;
      hideAllScreens(); editorBar.classList.remove("hidden");
      gameState = "editor"; document.body.classList.add("editor-mode");
      statusEl.textContent = "Imported";
    } else loadCustomLevel(data, false);
  } catch (err) {
    statusEl.textContent = "Import failed: " + (err.message || "bad");
  }
});

function returnToEditor() {
  if (customLevel) {
    editCols = customLevel.cols; editRows = customLevel.rows;
    editMap = customLevel.map.slice();
  }
  enterEditor();
}
backToEditorBtn.addEventListener("click", returnToEditor);
backToEditorWinBtn.addEventListener("click", returnToEditor);

var importStartBtn = document.getElementById("importStartBtn");
if (importStartBtn) {
  importStartBtn.addEventListener("click", function (e) {
    e.preventDefault();
    hideAllScreens();
    importModal.classList.remove("hidden");
    document.getElementById("importText").value = "";
  });
}

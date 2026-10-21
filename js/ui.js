/**
 * Joe's Juke — screens, buttons, import/export UI
 */
"use strict";

function hideAllScreens() {
  [startScreen, levelComplete, gameOver, winScreen, exportModal, importModal]
    .forEach(function (el) { if (el) el.classList.add("hidden"); });
  if (editorBar) editorBar.classList.add("hidden");
}
function showScreen(el) {
  hideAllScreens();
  el.classList.remove("hidden");
  var btn = el.querySelector("button:not(.hidden)");
  if (btn) setTimeout(function () { btn.focus(); }, 0);
}

function on(id, handler) {
  var el = document.getElementById(id);
  if (!el) { console.warn("Missing element:", id); return; }
  el.addEventListener("click", function (e) {
    e.preventDefault();
    handler(e);
  });
}

on("startBtn", function () { loadLevel(0); });
on("nextBtn", function () { loadLevel(level + 1); });
if (document.getElementById("startBtn")) {
  setTimeout(function () {
    if (gameState === "start" && startScreen && !startScreen.classList.contains("hidden")) {
      document.getElementById("startBtn").focus();
    }
  }, 0);
}
on("retryBtn", function () {
  if (fromEditor && customLevel) loadCustomLevel(customLevel, true);
  else if (customLevel) loadCustomLevel(customLevel, false);
  else loadLevel(level);
});
on("restartBtn", function () {
  if (fromEditor && customLevel) { enterEditor(); return; }
  loadLevel(0);
});
on("editorBtn", function () { enterEditor(); });
on("exitEditorBtn", function () {
  gameState = "start"; hideAllScreens();
  startScreen.classList.remove("hidden");
  document.body.classList.remove("editor-mode");
  statusEl.textContent = "Swipe or use D-pad";
  levelNumEl.textContent = "1"; levelTotalEl.textContent = String(LEVELS.length);
  COLS = 20; ROWS = 15; resizeCanvas();
  var sb = document.getElementById("startBtn");
  if (sb) setTimeout(function () { sb.focus(); }, 0);
});
on("resizeBtn", function () {
  var c = parseInt(document.getElementById("editCols").value, 10) || 20;
  var r = parseInt(document.getElementById("editRows").value, 10) || 15;
  c = Math.max(5, Math.min(100, c)); r = Math.max(5, Math.min(100, r));
  document.getElementById("editCols").value = c;
  document.getElementById("editRows").value = r;
  var old = editMap.slice(), oldC = editCols, oldR = editRows;
  editCols = c; editRows = r; editMap = [];
  for (var y = 0; y < r; y++) {
    var row = "";
    for (var x = 0; x < c; x++) {
      if (y < oldR && x < oldC && old[y]) row += old[y][x] || ".";
      else if (y === 0 || y === r - 1 || x === 0 || x === c - 1) row += "W";
      else row += ".";
    }
    editMap.push(row);
  }
  COLS = editCols; ROWS = editRows; resizeCanvas();
});
on("clearMapBtn", function () {
  editMap = [];
  for (var y = 0; y < editRows; y++) {
    var row = "";
    for (var x = 0; x < editCols; x++) {
      if (y === 0 || y === editRows - 1 || x === 0 || x === editCols - 1) row += "W";
      else row += ".";
    }
    editMap.push(row);
  }
  statusEl.textContent = "Cleared";
});
on("testLevelBtn", function () {
  var data = { name: "Test", cols: editCols, rows: editRows, map: editMap.slice(), version: 1 };
  loadCustomLevel(data, true);
});
on("exportBtn", function () {
  var data = { name: "Custom", cols: editCols, rows: editRows, map: editMap.slice(), version: 1 };
  document.getElementById("exportText").value = JSON.stringify(data, null, 2);
  hideAllScreens();
  exportModal.classList.remove("hidden");
});
on("importBtn", function () {
  hideAllScreens();
  importModal.classList.remove("hidden");
  document.getElementById("importText").value = "";
});
on("copyExportBtn", function () {
  var ta = document.getElementById("exportText");
  if (!ta) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(function () {
      statusEl.textContent = "Copied";
    }).catch(function () {
      ta.select(); document.execCommand("copy"); statusEl.textContent = "Copied";
    });
  } else {
    ta.select(); document.execCommand("copy"); statusEl.textContent = "Copied";
  }
});
on("downloadExportBtn", function () {
  var ta = document.getElementById("exportText");
  if (!ta) return;
  var blob = new Blob([ta.value], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "joejuke-level.json";
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
});
on("closeExportBtn", function () {
  if (document.body.classList.contains("editor-mode")) {
    hideAllScreens(); editorBar.classList.remove("hidden");
    gameState = "editor";
  } else {
    hideAllScreens(); startScreen.classList.remove("hidden");
  }
});
on("closeImportBtn", function () {
  if (document.body.classList.contains("editor-mode")) {
    hideAllScreens(); editorBar.classList.remove("hidden");
    gameState = "editor";
  } else {
    hideAllScreens(); startScreen.classList.remove("hidden");
  }
});

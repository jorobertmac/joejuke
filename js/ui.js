/**
 * Joe's Juke — screens, buttons, pause menu, import/export UI
 */
"use strict";

function hideAllScreens() {
  [startScreen, levelComplete, gameOver, winScreen, exportModal, importModal, pauseMenu]
    .forEach(function (el) { if (el) el.classList.add("hidden"); });
  if (editorBar) editorBar.classList.add("hidden");
}
function showScreen(el) {
  hideAllScreens();
  el.classList.remove("hidden");
  if (typeof setPauseBtnVisible === "function") setPauseBtnVisible(false);
  var btn = el.querySelector("button:not(.hidden)");
  if (btn) setTimeout(function () { btn.focus(); }, 0);
}

function setPauseBtnVisible(show) {
  if (!pauseBtn) return;
  if (show) pauseBtn.classList.remove("hidden");
  else pauseBtn.classList.add("hidden");
}

/** Open pause menu during play (or editor). */
function openPauseMenu() {
  var inEditorMenu = (gameState === "editor");
  if (gameState === "play") {
    gameState = "paused";
    if (player) {
      player.sliding = false;
      player.slideQueue = [];
      player.moving = false;
    }
  } else if (gameState === "editor") {
    // keep editor state; just show overlay
  } else if (gameState !== "paused") {
    return;
  }

  // Hide other overlays but keep editor bar when editing
  [startScreen, levelComplete, gameOver, winScreen, exportModal, importModal]
    .forEach(function (el) { if (el) el.classList.add("hidden"); });
  if (inEditorMenu) {
    if (editorBar) editorBar.classList.remove("hidden");
  } else if (editorBar) {
    editorBar.classList.add("hidden");
  }

  var title = document.getElementById("pauseTitle");
  var hint = document.getElementById("pauseHint");
  var restartBtn = document.getElementById("restartPauseBtn");
  var exitBtn = document.getElementById("exitPauseBtn");

  if (inEditorMenu) {
    if (title) title.textContent = "Editor Menu";
    if (hint) hint.textContent = "Esc / Space to close";
    if (restartBtn) restartBtn.classList.add("hidden");
    if (exitBtn) {
      exitBtn.textContent = "Exit to Menu";
      exitBtn.classList.remove("hidden");
    }
  } else {
    if (title) title.textContent = "Paused";
    if (hint) hint.textContent = "Space / Esc to resume";
    if (restartBtn) {
      restartBtn.classList.remove("hidden");
      restartBtn.textContent = fromEditor ? "Restart Test" : "Restart Level";
    }
    if (exitBtn) {
      exitBtn.classList.remove("hidden");
      exitBtn.textContent = fromEditor ? "Back to Editor" : "Exit to Menu";
    }
  }

  if (pauseMenu) {
    pauseMenu.classList.remove("hidden");
    var first = pauseMenu.querySelector("button:not(.hidden)");
    if (first) setTimeout(function () { first.focus(); }, 0);
  }
  if (statusEl && gameState === "paused") statusEl.textContent = "Paused";
}

function closePauseMenu() {
  if (!pauseMenu) return;
  pauseMenu.classList.add("hidden");
  if (gameState === "paused") {
    gameState = "play";
    if (statusEl) statusEl.textContent = fromEditor ? "Testing" : "Swipe or D-pad";
  } else if (gameState === "editor") {
    if (editorBar) editorBar.classList.remove("hidden");
    if (statusEl) statusEl.textContent = "Editor — arrows navigate palette, Enter selects";
  }
}

function togglePauseMenu() {
  var tag = (document.activeElement && document.activeElement.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (gameState === "play") {
    openPauseMenu();
  } else if (gameState === "paused") {
    closePauseMenu();
  } else if (gameState === "editor") {
    if (pauseMenu && !pauseMenu.classList.contains("hidden")) closePauseMenu();
    else openPauseMenu();
  }
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
  if (typeof applyEditZoom === "function") applyEditZoom();
  setPauseBtnVisible(false);
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
  var old = editMap.slice(), oldOv = (editOverlay || []).slice(), oldBl = (editBlocks || []).slice();
  var oldC = editCols, oldR = editRows;
  editCols = c; editRows = r; editMap = []; editOverlay = [];
  for (var y = 0; y < r; y++) {
    var row = "";
    var oRow = "";
    for (var x = 0; x < c; x++) {
      if (y < oldR && x < oldC && old[y]) row += old[y][x] || ".";
      else if (y === 0 || y === r - 1 || x === 0 || x === c - 1) row += "W";
      else row += ".";
      if (y < oldR && x < oldC && oldOv[y] && oldOv[y][x] && oldOv[y][x] !== " ") oRow += oldOv[y][x];
      else oRow += " ";
    }
    editMap.push(row);
    editOverlay.push(oRow);
  }
  editBlocks = oldBl.filter(function (b) { return b.x < c && b.y < r; });
  COLS = editCols; ROWS = editRows; resizeCanvas();
});
on("clearMapBtn", function () {
  editMap = []; editOverlay = []; editBlocks = [];
  for (var y = 0; y < editRows; y++) {
    var row = "";
    var oRow = "";
    for (var x = 0; x < editCols; x++) {
      if (y === 0 || y === editRows - 1 || x === 0 || x === editCols - 1) row += "W";
      else row += ".";
      oRow += " ";
    }
    editMap.push(row);
    editOverlay.push(oRow);
  }
  statusEl.textContent = "Cleared";
});
on("testLevelBtn", function () {
  var data = (typeof getLevelData === "function")
    ? getLevelData()
    : { name: "Test", cols: editCols, rows: editRows, map: editMap.slice(), version: 4 };
  data.name = "Test";
  loadCustomLevel(data, true);
});
on("exportBtn", function () {
  var data = (typeof getLevelData === "function")
    ? getLevelData()
    : { name: "Custom", cols: editCols, rows: editRows, map: editMap.slice(), version: 4 };
  data.name = "Custom";
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

/* ---- Pause menu ---- */
on("pauseBtn", function () { togglePauseMenu(); });
on("resumeBtn", function () { closePauseMenu(); });
on("restartPauseBtn", function () {
  if (fromEditor && customLevel) loadCustomLevel(customLevel, true);
  else if (customLevel) loadCustomLevel(customLevel, false);
  else loadLevel(level);
});
on("exitPauseBtn", function () {
  // Testing from editor → return to editor
  if (fromEditor && customLevel && gameState === "paused") {
    enterEditor();
    return;
  }
  // Editor menu or normal play → start screen
  gameState = "start";
  customLevel = null;
  fromEditor = false;
  hideAllScreens();
  startScreen.classList.remove("hidden");
  document.body.classList.remove("editor-mode");
  if (typeof applyEditZoom === "function") applyEditZoom();
  setPauseBtnVisible(false);
  statusEl.textContent = "Swipe or use D-pad";
  levelNumEl.textContent = "1";
  levelTotalEl.textContent = String(LEVELS.length);
  COLS = 20; ROWS = 15; resizeCanvas();
  var sb = document.getElementById("startBtn");
  if (sb) setTimeout(function () { sb.focus(); }, 0);
});

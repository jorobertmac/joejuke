/**
 * FOV + editor size overrides — load after game.js
 * Chip's Challenge 9x9 view; editor max 100x100, default 32x32
 */
"use strict";

editCols = 32;
editRows = 32;

function resizeCanvas() {
  if (gameState === "editor") {
    canvas.width = Math.max(1, COLS) * TILE;
    canvas.height = Math.max(1, ROWS) * TILE;
  } else {
    canvas.width = VIEW_COLS * TILE;
    canvas.height = VIEW_ROWS * TILE;
  }
}

function getCamera() {
  var halfW = Math.floor((VIEW_COLS - 1) / 2);
  var halfH = Math.floor((VIEW_ROWS - 1) / 2);
  var camX = player.x - halfW;
  var camY = player.y - halfH;
  if (COLS <= VIEW_COLS) camX = Math.floor((COLS - VIEW_COLS) / 2);
  else camX = Math.max(0, Math.min(COLS - VIEW_COLS, camX));
  if (ROWS <= VIEW_ROWS) camY = Math.floor((ROWS - VIEW_ROWS) / 2);
  else camY = Math.max(0, Math.min(ROWS - VIEW_ROWS, camY));
  return { camX: camX, camY: camY };
}

// Ensure FOV canvas after entering play
(function wrapLoaders() {
  var _loadLevel = loadLevel;
  loadLevel = function (n) {
    _loadLevel(n);
    resizeCanvas();
  };
  var _loadCustom = loadCustomLevel;
  loadCustomLevel = function (data, testing) {
    _loadCustom(data, testing);
    resizeCanvas();
  };
})();

// Resize button: max 100x100
(function patchResizeBtn() {
  function apply() {
    var cEl = document.getElementById("editCols");
    var rEl = document.getElementById("editRows");
    if (!cEl || !rEl) return;
    var c = parseInt(cEl.value, 10) || 32;
    var r = parseInt(rEl.value, 10) || 32;
    c = Math.max(5, Math.min(100, c));
    r = Math.max(5, Math.min(100, r));
    cEl.value = c;
    rEl.value = r;
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
  }
  var btn = document.getElementById("resizeBtn");
  if (btn) {
    var neu = btn.cloneNode(true);
    btn.parentNode.replaceChild(neu, btn);
    neu.addEventListener("click", function (e) {
      e.preventDefault();
      apply();
    });
  }
})();

// Apply FOV size on first paint if already in play
if (typeof requestAnimationFrame === "function") {
  requestAnimationFrame(function () { resizeCanvas(); });
}

/**
 * FOV + editor size safety net (load after game.js).
 * Ensures 9×9 play FOV; editor uses tile viewport (editViewSize).
 */
"use strict";

function resizeCanvas() {
  var inEditor = (gameState === "editor") ||
    (document.body && document.body.classList.contains("editor-mode"));
  if (inEditor) {
    var vs = (typeof editViewSize === "number" && editViewSize > 0) ? editViewSize : 32;
    canvas.width = Math.max(1, vs) * TILE;
    canvas.height = Math.max(1, vs) * TILE;
  } else {
    canvas.width = ((typeof VIEW_COLS === "number") ? VIEW_COLS : 9) * TILE;
    canvas.height = ((typeof VIEW_ROWS === "number") ? VIEW_ROWS : 9) * TILE;
  }
}

function getCamera() {
  var vc = (typeof VIEW_COLS === "number") ? VIEW_COLS : 9;
  var vr = (typeof VIEW_ROWS === "number") ? VIEW_ROWS : 9;
  var halfW = Math.floor((vc - 1) / 2);
  var halfH = Math.floor((vr - 1) / 2);
  var px = (player && typeof player.x === "number") ? player.x : 0;
  var py = (player && typeof player.y === "number") ? player.y : 0;
  var camX = px - halfW;
  var camY = py - halfH;
  if (COLS <= vc) camX = Math.floor((COLS - vc) / 2);
  else camX = Math.max(0, Math.min(COLS - vc, camX));
  if (ROWS <= vr) camY = Math.floor((ROWS - vr) / 2);
  else camY = Math.max(0, Math.min(ROWS - vr, camY));
  return { camX: camX, camY: camY };
}

(function wrapLoaders() {
  if (typeof loadLevel === "function") {
    var _loadLevel = loadLevel;
    loadLevel = function (n) {
      _loadLevel(n);
      resizeCanvas();
    };
  }
  if (typeof loadCustomLevel === "function") {
    var _loadCustom = loadCustomLevel;
    loadCustomLevel = function (data, testing) {
      _loadCustom(data, testing);
      resizeCanvas();
    };
  }
  if (typeof enterEditor === "function") {
    var _enterEditor = enterEditor;
    enterEditor = function () {
      _enterEditor();
      gameState = "editor";
      if (document.body) document.body.classList.add("editor-mode");
      COLS = editCols;
      ROWS = editRows;
      if (typeof applyEditZoom === "function") applyEditZoom();
      else resizeCanvas();
    };
  }
})();

/**
 * Rebind editor resize/clear to packed 2-char IDs (safety net if ui.js is stale).
 */
"use strict";

(function () {
  function on(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    var neo = el.cloneNode(true);
    el.parentNode.replaceChild(neo, el);
    neo.addEventListener("click", fn);
  }

  function wire() {
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
          if (y < oldR && x < oldC && old[y]) {
            row += (typeof cellId === "function") ? cellId(old[y], x, FLOOR_ID) : FLOOR_ID;
          } else if (y === 0 || y === r - 1 || x === 0 || x === c - 1) {
            row += "99";
          } else {
            row += FLOOR_ID;
          }
          if (y < oldR && x < oldC && oldOv[y]) {
            var och = (typeof cellId === "function") ? cellId(oldOv[y], x, EMPTY_ID) : EMPTY_ID;
            oRow += (och && och !== EMPTY_ID) ? och : EMPTY_ID;
          } else {
            oRow += EMPTY_ID;
          }
        }
        editMap.push(row);
        editOverlay.push(oRow);
      }
      editBlocks = oldBl.filter(function (b) { return b.x < c && b.y < r; });
      COLS = editCols; ROWS = editRows;
      if (typeof resizeCanvas === "function") resizeCanvas();
    });

    on("clearMapBtn", function () {
      editMap = []; editOverlay = []; editBlocks = [];
      for (var y = 0; y < editRows; y++) {
        var row = "";
        var oRow = "";
        for (var x = 0; x < editCols; x++) {
          if (y === 0 || y === editRows - 1 || x === 0 || x === editCols - 1) row += "99";
          else row += FLOOR_ID;
          oRow += EMPTY_ID;
        }
        editMap.push(row);
        editOverlay.push(oRow);
      }
      if (statusEl) statusEl.textContent = "Cleared";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);
})();

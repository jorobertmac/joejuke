/**
 * Rebind eyedropAt + fav fallback text for packed 2-char IDs.
 */
"use strict";

(function () {
  function eyedropAt2(clientX, clientY) {
    if (gameState !== "editor") return;
    var t = canvasToTile(clientX, clientY);
    if (t.x < 0 || t.y < 0 || t.x >= editCols || t.y >= editRows) return;
    var layer = editLayer || "base";
    var ch = FLOOR_ID;
    if (layer === "item") {
      ch = (typeof getOverlayChar === "function") ? getOverlayChar(t.x, t.y) : EMPTY_ID;
      if (!ch || ch === EMPTY_ID || ch === " ") ch = FLOOR_ID;
    } else if (layer === "block") {
      ch = (typeof hasEditBlock === "function" && hasEditBlock(t.x, t.y)) ? "BK" : FLOOR_ID;
    } else {
      ch = (typeof getEditChar === "function") ? getEditChar(t.x, t.y) : cellId(editMap[t.y], t.x, FLOOR_ID);
    }
    if (typeof selectPaletteTile === "function") selectPaletteTile(ch);
    if (statusEl) statusEl.textContent = "Eyedrop (" + layer + "): " + (TILE_LABELS[ch] || ch);
  }

  function wire() {
    if (typeof eyedropAt === "function") {
      eyedropAt = eyedropAt2;
    } else {
      window.eyedropAt = eyedropAt2;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);
})();

/**
 * Rebind drawMapTiles editor path to packed 2-char IDs (safety net if drawing.js is stale).
 */
"use strict";

(function () {
  if (typeof drawMapTiles !== "function") return;
  var _orig = drawMapTiles;
  drawMapTiles = function (useEdit, camX, camY) {
    if (!useEdit) return _orig(useEdit, camX, camY);
    var vs = (typeof editViewSize === "number" && editViewSize > 0) ? editViewSize : 32;
    var ox = (typeof editCamX === "number") ? editCamX : 0;
    var oy = (typeof editCamY === "number") ? editCamY : 0;
    if (typeof ensureEditOverlay === "function") ensureEditOverlay();
    for (var vy = 0; vy < vs; vy++) {
      for (var vx = 0; vx < vs; vx++) {
        var x = ox + vx, y = oy + vy;
        var px = vx * TILE, py = vy * TILE;
        if (y < 0 || y >= editRows || x < 0 || x >= editCols || !editMap[y]) {
          ctx.fillStyle = "#0a0a14";
          ctx.fillRect(px, py, TILE, TILE);
          continue;
        }
        var ch = (typeof getEditChar === "function") ? getEditChar(x, y) : cellId(editMap[y], x, FLOOR_ID);
        if (CH[ch] !== undefined) {
          var id = CH[ch];
          if ((id >= T.KEY_B && id <= T.KEY_Y) || (id >= T.BOOT_FLIP && id <= T.BOOT_SUCTION) || id === T.CHIP || id === T.BLOCK) {
            drawTerrain(T.FLOOR, px, py);
          } else {
            drawTerrain(id, px, py);
          }
        } else if (MONSTER_CHARS[ch]) {
          drawTerrain(T.FLOOR, px, py);
        } else if (ch === PLAYER_ID) {
          drawTerrain(T.FLOOR, px, py);
        } else {
          drawTerrain(T.FLOOR, px, py);
        }
        var och = (typeof getOverlayChar === "function") ? getOverlayChar(x, y) : EMPTY_ID;
        if (och && och !== EMPTY_ID && och !== FLOOR_ID && CH[och] !== undefined) {
          drawOverlayItem(CH[och], px, py);
        } else if (CH[ch] !== undefined) {
          var id2 = CH[ch];
          if ((id2 >= T.KEY_B && id2 <= T.KEY_Y) || (id2 >= T.BOOT_FLIP && id2 <= T.BOOT_SUCTION) || id2 === T.CHIP) {
            drawOverlayItem(id2, px, py);
          }
        }
        var hasBlk = (typeof hasEditBlock === "function") ? hasEditBlock(x, y) : false;
        if (hasBlk || ch === "BK") drawBlock(px, py);
        if (MONSTER_CHARS[ch]) {
          drawEnemy({ type: MONSTER_CHARS[ch].type, dir: MONSTER_CHARS[ch].dir }, px, py);
        } else if (ch === PLAYER_ID) {
          drawJoe(px, py, 0, 0);
        }
      }
    }
  };
})();

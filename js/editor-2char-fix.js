/**
 * Minimal editor 2-char overrides (setEditChar, overlays, init, getLevelData, loadIntoEditor).
 */
"use strict";

(function () {
  if (typeof PALETTE_ICONS !== "undefined") {
    var _icons = {
      "00":"resources/tiles/terrain_floor.png","99":"resources/tiles/terrain_wall.png",
      "~~":"resources/tiles/terrain_water.png","FF":"resources/tiles/terrain_fire.png",
      "II":"resources/tiles/terrain_ice.png","I1":"resources/tiles/terrain_ice_nw.png",
      "I3":"resources/tiles/terrain_ice_ne.png","I7":"resources/tiles/terrain_ice_sw.png",
      "I9":"resources/tiles/terrain_ice_se.png","FN":"resources/tiles/terrain_force_n.png",
      "FE":"resources/tiles/terrain_force_e.png","FS":"resources/tiles/terrain_force_s.png",
      "FW":"resources/tiles/terrain_force_w.png","FR":"resources/tiles/terrain_force_r.png",
      "DD":"resources/tiles/terrain_dirt.png","GG":"resources/tiles/terrain_gravel.png",
      "EX":"resources/tiles/terrain_exit.png","SX":"resources/tiles/terrain_socket.png",
      "CH":"resources/tiles/item_chip.png","??":"resources/tiles/terrain_hint.png",
      "97":"resources/tiles/terrain_invis.png","98":"resources/tiles/terrain_hidden.png",
      "RR":"resources/tiles/terrain_recessed.png","BR":"resources/tiles/terrain_blue_real.png",
      "BF":"resources/tiles/terrain_blue_fake.png","TN":"resources/tiles/terrain_thin_n.png",
      "TE":"resources/tiles/terrain_thin_e.png","TS":"resources/tiles/terrain_thin_s.png",
      "TW":"resources/tiles/terrain_thin_w.png","TP":"resources/tiles/terrain_teleport.png",
      "BM":"resources/tiles/terrain_bomb.png","TH":"resources/tiles/terrain_thief.png",
      "TR":"resources/tiles/terrain_trap_closed.png","VW":"resources/tiles/terrain_toggle_wall.png",
      "VF":"resources/tiles/terrain_toggle_floor.png","CL":"resources/tiles/terrain_cloner.png",
      "BG":"resources/tiles/item_btn_green.png","RD":"resources/tiles/item_btn_red.png",
      "BB":"resources/tiles/item_btn_blue.png","BN":"resources/tiles/item_btn_brown.png",
      "KB":"resources/tiles/item_key_blue.png","KR":"resources/tiles/item_key_red.png",
      "KG":"resources/tiles/item_key_green.png","KY":"resources/tiles/item_key_yellow.png",
      "LB":"resources/tiles/item_lock_blue.png","LR":"resources/tiles/item_lock_red.png",
      "LG":"resources/tiles/item_lock_green.png","LY":"resources/tiles/item_lock_yellow.png",
      "Bf":"resources/tiles/item_boot_flip.png","Bi":"resources/tiles/item_boot_ice.png",
      "Bs":"resources/tiles/item_boot_suction.png","By":"resources/tiles/item_boot_fire.png",
      "BK":"resources/tiles/item_block.png",
      "mb":"resources/monsters/ball_e_0.png","mB":"resources/monsters/ball_s_0.png",
      "mg":"resources/monsters/glider_e_0.png","mf":"resources/monsters/fireball_e_0.png",
      "mu":"resources/monsters/bug_n_0.png","mc":"resources/monsters/paramecium_n_0.png",
      "mt":"resources/monsters/tank_e_0.png","mw":"resources/monsters/walker_e_0.png",
      "me":"resources/monsters/teeth_s_0.png","mo":"resources/monsters/blob_e_0.png",
      "J0":"resources/sprites/joe_s_idle.png"
    };
    for (var k in _icons) PALETTE_ICONS[k] = _icons[k];
  }

  window.ensureEditOverlay = function () {
    if (!editOverlay) editOverlay = [];
    var emptyRow = "";
    for (var i = 0; i < editCols; i++) emptyRow += EMPTY_ID;
    while (editOverlay.length < editRows) editOverlay.push(emptyRow);
    for (var y = 0; y < editRows; y++) {
      var row = editOverlay[y] || "";
      if (row.length === editCols && editCols > 0 && row.length % 2 !== 0) {
        row = (typeof migrateLegacyRow === "function") ? migrateLegacyRow(row) : row;
      }
      var need = editCols * 2;
      while (row.length < need) row += EMPTY_ID;
      if (row.length > need) row = row.slice(0, need);
      editOverlay[y] = row;
    }
    editOverlay.length = editRows;
  };

  window.setOverlayChar = function (x, y, id) {
    ensureEditOverlay();
    if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
    var c = (id && id !== FLOOR_ID && id.length === 2) ? id : EMPTY_ID;
    editOverlay[y] = setCellId(editOverlay[y], x, c, editCols, EMPTY_ID);
  };

  window.getOverlayChar = function (x, y) {
    if (!editOverlay || y < 0 || y >= editRows || x < 0 || x >= editCols) return EMPTY_ID;
    return cellId(editOverlay[y], x, EMPTY_ID);
  };

  window.getEditChar = function (x, y) {
    if (y < 0 || y >= editRows || x < 0 || x >= editCols) return FLOOR_ID;
    return cellId(editMap[y], x, FLOOR_ID);
  };

  window.setEditChar = function (x, y, ch) {
    if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
    ensureEditOverlay();
    var layer = editLayer || "base";
    if (layer === "item") {
      if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) setOverlayChar(x, y, ch);
      else setOverlayChar(x, y, EMPTY_ID);
      return;
    }
    if (layer === "block") {
      setEditBlock(x, y, ch === "BK" || (typeof isBlockChar === "function" && isBlockChar(ch)));
      return;
    }
    if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
      var cur = getEditChar(x, y);
      if (cur !== PLAYER_ID && cur !== "EX") {
        editMap[y] = setCellId(editMap[y], x, FLOOR_ID, editCols, FLOOR_ID);
      }
      setOverlayChar(x, y, ch);
      return;
    }
    if (ch === "BK" || (typeof isBlockChar === "function" && isBlockChar(ch))) {
      var cur2 = getEditChar(x, y);
      if (cur2 !== PLAYER_ID && cur2 !== "EX") {
        editMap[y] = setCellId(editMap[y], x, FLOOR_ID, editCols, FLOOR_ID);
      }
      setEditBlock(x, y, true);
      return;
    }
    if (ch === PLAYER_ID || ch === "EX") {
      for (var yy = 0; yy < editRows; yy++)
        for (var xx = 0; xx < editCols; xx++)
          if (getEditChar(xx, yy) === ch)
            editMap[yy] = setCellId(editMap[yy], xx, FLOOR_ID, editCols, FLOOR_ID);
    }
    editMap[y] = setCellId(editMap[y], x, ch, editCols, FLOOR_ID);
    if (ch === "99" || ch === "~~" || ch === "FF") {
      setOverlayChar(x, y, EMPTY_ID);
      setEditBlock(x, y, false);
    }
  };

  window.initEmptyMap = function (cols, rows) {
    editCols = cols; editRows = rows;
    editMap = []; editOverlay = []; editBlocks = [];
    for (var y = 0; y < rows; y++) {
      var row = "", oRow = "";
      for (var x = 0; x < cols; x++) {
        row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "99" : FLOOR_ID;
        oRow += EMPTY_ID;
      }
      editMap.push(row); editOverlay.push(oRow);
    }
    var prev = editLayer; editLayer = "base";
    setEditChar(1, 1, PLAYER_ID);
    setEditChar(cols - 2, rows - 2, "EX");
    editLayer = prev || "base";
    if (typeof updateLayerUI === "function") updateLayerUI();
  };

  window.getLevelData = function () {
    ensureEditOverlay();
    var hasOverlay = false;
    for (var y = 0; y < editRows; y++) {
      var row = editOverlay[y] || "";
      for (var x = 0; x < editCols; x++) {
        var och = cellId(row, x, EMPTY_ID);
        if (och && och !== EMPTY_ID) { hasOverlay = true; break; }
      }
      if (hasOverlay) break;
    }
    var data = { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 4 };
    if (hasOverlay) data.overlay = editOverlay.slice();
    if (editBlocks && editBlocks.length) {
      data.blocks = editBlocks.map(function (b) { return { x: b.x, y: b.y }; });
    }
    return data;
  };

  window.loadIntoEditor = function (data) {
    if (!data) return;
    var raw0 = data.map && data.map[0];
    var cols = data.cols || (raw0 ? (typeof rowCols === "function" ? rowCols(raw0) : Math.floor(String(raw0).length / 2) || String(raw0).length) : 20);
    var rows = data.rows || (data.map && data.map.length) || 15;
    editCols = cols; editRows = rows;
    if (data.overlay || data.blocks) {
      editMap = (data.map || []).map(function (r) {
        var s = (typeof migrateLegacyRow === "function") ? migrateLegacyRow(String(r)) : String(r);
        var need = cols * 2;
        while (s.length < need) s += FLOOR_ID;
        return s.slice(0, need);
      });
      while (editMap.length < rows) {
        var er = ""; for (var i = 0; i < cols; i++) er += FLOOR_ID; editMap.push(er);
      }
      editMap.length = rows;
      if (data.overlay) {
        editOverlay = data.overlay.map(function (r) {
          var s = String(r);
          if (typeof migrateLegacyRow === "function" && s.length === cols) s = migrateLegacyRow(s);
          var need = cols * 2;
          while (s.length < need) s += EMPTY_ID;
          return s.slice(0, need);
        });
        while (editOverlay.length < rows) {
          var eo = ""; for (var j = 0; j < cols; j++) eo += EMPTY_ID; editOverlay.push(eo);
        }
        editOverlay.length = rows;
      } else { editOverlay = []; ensureEditOverlay(); }
      editBlocks = (data.blocks || []).map(function (b) { return { x: b.x, y: b.y }; });
    } else if (typeof splitMapIntoLayers === "function") {
      var split = splitMapIntoLayers(data.map || [], cols, rows);
      editMap = split.map; editOverlay = split.overlay; editBlocks = split.blocks;
    }
    editLayer = "base";
    if (typeof updateLayerUI === "function") updateLayerUI();
  };
})();

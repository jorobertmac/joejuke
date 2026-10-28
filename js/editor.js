/**
 * Joe's Juke — level editor
 */
"use strict";

/** Map palette 2-char IDs to icon image paths (32×32 tiles / monster frames). */
var PALETTE_ICONS = {
  "00": "resources/tiles/terrain_floor.png",
  "99": "resources/tiles/terrain_wall.png",
  "~~": "resources/tiles/terrain_water.png",
  "FF": "resources/tiles/terrain_fire.png",
  "II": "resources/tiles/terrain_ice.png",
  "I1": "resources/tiles/terrain_ice_nw.png",
  "I3": "resources/tiles/terrain_ice_ne.png",
  "I7": "resources/tiles/terrain_ice_sw.png",
  "I9": "resources/tiles/terrain_ice_se.png",
  "FN": "resources/tiles/terrain_force_n.png",
  "FE": "resources/tiles/terrain_force_e.png",
  "FS": "resources/tiles/terrain_force_s.png",
  "FW": "resources/tiles/terrain_force_w.png",
  "FR": "resources/tiles/terrain_force_r.png",
  "DD": "resources/tiles/terrain_dirt.png",
  "GG": "resources/tiles/terrain_gravel.png",
  "EX": "resources/tiles/terrain_exit.png",
  "SX": "resources/tiles/terrain_socket.png",
  "CH": "resources/tiles/item_chip.png",
  "??": "resources/tiles/terrain_hint.png",
  "97": "resources/tiles/terrain_invis.png",
  "98": "resources/tiles/terrain_hidden.png",
  "RR": "resources/tiles/terrain_recessed.png",
  "BR": "resources/tiles/terrain_blue_real.png",
  "BF": "resources/tiles/terrain_blue_fake.png",
  "TN": "resources/tiles/terrain_thin_n.png",
  "TE": "resources/tiles/terrain_thin_e.png",
  "TS": "resources/tiles/terrain_thin_s.png",
  "TW": "resources/tiles/terrain_thin_w.png",
  "TP": "resources/tiles/terrain_teleport.png",
  "BM": "resources/tiles/terrain_bomb.png",
  "TH": "resources/tiles/terrain_thief.png",
  "TR": "resources/tiles/terrain_trap_closed.png",
  "VW": "resources/tiles/terrain_toggle_wall.png",
  "VF": "resources/tiles/terrain_toggle_floor.png",
  "CL": "resources/tiles/terrain_cloner.png",
  "BG": "resources/tiles/item_btn_green.png",
  "RD": "resources/tiles/item_btn_red.png",
  "BB": "resources/tiles/item_btn_blue.png",
  "BN": "resources/tiles/item_btn_brown.png",
  "KB": "resources/tiles/item_key_blue.png",
  "KR": "resources/tiles/item_key_red.png",
  "KG": "resources/tiles/item_key_green.png",
  "KY": "resources/tiles/item_key_yellow.png",
  "LB": "resources/tiles/item_lock_blue.png",
  "LR": "resources/tiles/item_lock_red.png",
  "LG": "resources/tiles/item_lock_green.png",
  "LY": "resources/tiles/item_lock_yellow.png",
  "Bf": "resources/tiles/item_boot_flip.png",
  "Bi": "resources/tiles/item_boot_ice.png",
  "Bs": "resources/tiles/item_boot_suction.png",
  "By": "resources/tiles/item_boot_fire.png",
  "BK": "resources/tiles/item_block.png",
  "mb": "resources/monsters/ball_e_0.png",
  "mB": "resources/monsters/ball_s_0.png",
  "mg": "resources/monsters/glider_e_0.png",
  "mf": "resources/monsters/fireball_e_0.png",
  "mu": "resources/monsters/bug_n_0.png",
  "mc": "resources/monsters/paramecium_n_0.png",
  "mt": "resources/monsters/tank_e_0.png",
  "mw": "resources/monsters/walker_e_0.png",
  "me": "resources/monsters/teeth_s_0.png",
  "mo": "resources/monsters/blob_e_0.png",
  "J0": "resources/sprites/joe_s_idle.png",
};

/** Ensure editOverlay has same dimensions as editMap (EMPTY_ID = empty). */
function ensureEditOverlay() {
  if (!editOverlay) editOverlay = [];
  var emptyRow = "";
  for (var i = 0; i < editCols; i++) emptyRow += EMPTY_ID;
  while (editOverlay.length < editRows) {
    editOverlay.push(emptyRow);
  }
  for (var y = 0; y < editRows; y++) {
    var row = editOverlay[y] || "";
    // migrate legacy single-char overlay if needed
    if (row.length === editCols && editCols > 0 && row.length % 2 !== 0) {
      row = (typeof migrateLegacyRow === "function") ? migrateLegacyRow(row) : row;
    }
    var need = editCols * 2;
    while (row.length < need) row += EMPTY_ID;
    if (row.length > need) row = row.slice(0, need);
    editOverlay[y] = row;
  }
  editOverlay.length = editRows;
}

function setOverlayChar(x, y, id) {
  ensureEditOverlay();
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  var c = (id && id !== FLOOR_ID && id.length === 2) ? id : EMPTY_ID;
  editOverlay[y] = setCellId(editOverlay[y], x, c, editCols, EMPTY_ID);
}

function getOverlayChar(x, y) {
  if (!editOverlay || y < 0 || y >= editRows || x < 0 || x >= editCols) return EMPTY_ID;
  return cellId(editOverlay[y], x, EMPTY_ID);
}

function hasEditBlock(x, y) {
  return editBlocks.some(function (b) { return b.x === x && b.y === y; });
}

function setEditBlock(x, y, on) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  editBlocks = editBlocks.filter(function (b) { return !(b.x === x && b.y === y); });
  if (on) editBlocks.push({ x: x, y: y });
}

function getEditChar(x, y) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return FLOOR_ID;
  return cellId(editMap[y], x, FLOOR_ID);
}

/**
 * Split a map (legacy 1-char or packed 2-char) into base + overlay + blocks
 * so the editor can show and edit layers independently.
 */
function splitMapIntoLayers(srcMap, cols, rows) {
  var base = [];
  var ov = [];
  var blks = [];
  for (var y = 0; y < rows; y++) {
    var src = (srcMap && srcMap[y]) ? srcMap[y] : "";
    // migrate legacy if needed
    if (typeof migrateLegacyRow === "function" && src.length === cols) {
      src = migrateLegacyRow(src);
    }
    var bRow = "";
    var oRow = "";
    for (var x = 0; x < cols; x++) {
      var ch = cellId(src, x, FLOOR_ID);
      if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
        bRow += FLOOR_ID;
        oRow += ch;
      } else if (ch === "BK" || isBlockChar(ch)) {
        bRow += FLOOR_ID;
        oRow += EMPTY_ID;
        blks.push({ x: x, y: y });
      } else {
        bRow += ch;
        oRow += EMPTY_ID;
      }
    }
    base.push(bRow);
    ov.push(oRow);
  }
  return { map: base, overlay: ov, blocks: blks };
}

function initEmptyMap(cols, rows) {
  editCols = cols;
  editRows = rows;
  editMap = [];
  editOverlay = [];
  editBlocks = [];
  for (var y = 0; y < rows; y++) {
    var row = "";
    var oRow = "";
    for (var x = 0; x < cols; x++) {
      row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "99" : FLOOR_ID;
      oRow += EMPTY_ID;
    }
    editMap.push(row);
    editOverlay.push(oRow);
  }
  var prev = editLayer;
  editLayer = "base";
  setEditChar(1, 1, PLAYER_ID);
  setEditChar(cols - 2, rows - 2, "EX");
  editLayer = prev || "base";
  if (typeof updateLayerUI === "function") updateLayerUI();
}

function setEditChar(x, y, ch) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  ensureEditOverlay();
  // normalize legacy single-char paint if someone still passes one
  if (ch && ch.length === 1 && typeof LEGACY_CH !== "undefined" && LEGACY_CH[ch]) {
    ch = LEGACY_CH[ch];
  }
  var layer = editLayer || "base";
  if (layer === "item") {
    if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
      setOverlayChar(x, y, ch);
    } else {
      setOverlayChar(x, y, EMPTY_ID);
    }
    return;
  }
  if (layer === "block") {
    setEditBlock(x, y, ch === "BK" || isBlockChar(ch));
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
  if (ch === "BK" || isBlockChar(ch)) {
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
}

function setEditLayer(layer) {
  if (layer !== "base" && layer !== "item" && layer !== "block") return;
  editLayer = layer;
  if (typeof updateLayerUI === "function") updateLayerUI();
  if (statusEl) {
    var names = { base: "Base (terrain)", item: "Item (chips/keys/boots)", block: "Block" };
    statusEl.textContent = "Layer: " + (names[layer] || layer);
  }
}

function updateLayerUI() {
  document.querySelectorAll(".layer-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.layer === editLayer);
  });
}

function paletteKeyLabel(id) {
  if (!id || id === EMPTY_ID) return "Sp";
  return id;
}

var PALETTE_CATS = {
  terrain: ["00","99","~~","FF","II","I1","I3","I7","I9","FN","FE","FS","FW","FR","DD","GG","97","98","RR","BR","BF","TN","TE","TS","TW"],
  items: ["CH","KB","KR","KG","KY","Bf","Bi","Bs","By"],
  doors: ["SX","LB","LR","LG","LY"],
  monsters: ["mb","mB","mg","mf","mu","mc","mt","mw","me","mo"],
  special: ["EX","??","TP","BM","TH","TR","VW","VF","CL","BG","RD","BB","BN","BK","J0"]
};

function paletteCategoryOf(id) {
  if (PALETTE_CATS.terrain.indexOf(id) >= 0) return "terrain";
  if (PALETTE_CATS.items.indexOf(id) >= 0) return "items";
  if (PALETTE_CATS.doors.indexOf(id) >= 0) return "doors";
  if (PALETTE_CATS.monsters.indexOf(id) >= 0) return "monsters";
  return "special";
}

var paletteFilterCat = "all";

function isCoarsePointer() {
  try {
    return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  } catch (e) {
    return "ontouchstart" in window;
  }
}

function applyPaletteFilter() {
  var palette = document.getElementById("palette");
  if (!palette) return;
  var cat = paletteFilterCat || "all";
  palette.querySelectorAll(".palette-btn").forEach(function (btn) {
    var ch = btn.dataset.ch;
    var show = cat === "all" || paletteCategoryOf(ch) === cat;
    btn.classList.toggle("palette-hidden", !show);
    btn.hidden = !show;
  });
  document.querySelectorAll(".palette-cat").forEach(function (b) {
    b.classList.toggle("active", b.dataset.cat === cat);
  });
}

function setPaletteFilter(cat) {
  paletteFilterCat = cat || "all";
  applyPaletteFilter();
}

function buildPalette() {
  const palette = document.getElementById("palette");
  if (!palette) return;
  palette.innerHTML = "";
  var allowDrag = !isCoarsePointer();
  ALL_CHARS.forEach(ch => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn" + (ch === selectedTile ? " active" : "");
    btn.dataset.ch = ch;
    btn.dataset.cat = paletteCategoryOf(ch);
    const label = TILE_LABELS[ch] || ch;
    btn.title = label + " (" + ch + ")";
    btn.setAttribute("aria-label", label);
    const iconSrc = PALETTE_ICONS[ch];
    if (iconSrc) {
      const img = document.createElement("img");
      img.src = iconSrc;
      img.alt = "";
      img.className = "palette-icon";
      img.draggable = false;
      img.loading = "lazy";
      img.onerror = function () {
        this.style.display = "none";
        if (!btn.querySelector(".palette-fallback")) {
          const fb = document.createElement("span");
          fb.className = "palette-fallback";
          fb.textContent = (ch === "00") ? "·" : ch;
          btn.insertBefore(fb, btn.firstChild);
        }
      };
      btn.appendChild(img);
    } else {
      const fb = document.createElement("span");
      fb.className = "palette-fallback";
      fb.textContent = (ch === "00") ? "·" : ch;
      btn.appendChild(fb);
    }
    const key = document.createElement("span");
    key.className = "palette-key";
    key.textContent = paletteKeyLabel(ch);
    btn.appendChild(key);
    if (allowDrag) {
      btn.draggable = true;
      btn.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/joejuke-tile", ch);
        e.dataTransfer.setData("text/plain", ch);
        e.dataTransfer.effectAllowed = "copy";
      });
    }
    btn.addEventListener("click", function (e) {
      if (e.shiftKey) {
        e.preventDefault();
        if (typeof toggleFavoriteFromPalette === "function") toggleFavoriteFromPalette(ch);
        return;
      }
      selectedTile = ch;
      palette.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (statusEl) statusEl.textContent = "Paint: " + label;
      if (!isCoarsePointer()) btn.focus();
    });
    var longPressTimer = null;
    btn.addEventListener("touchstart", function () {
      longPressTimer = setTimeout(function () {
        longPressTimer = null;
        if (typeof toggleFavoriteFromPalette === "function") toggleFavoriteFromPalette(ch);
      }, 550);
    }, { passive: true });
    btn.addEventListener("touchend", function () {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    }, { passive: true });
    btn.addEventListener("touchmove", function () {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    }, { passive: true });
    btn.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btn.click();
      }
    });
    palette.appendChild(btn);
  });
  applyPaletteFilter();
  var activeBtn = palette.querySelector(".palette-btn.active");
  if (activeBtn) activeBtn.setAttribute("tabindex", "0");
  if (typeof renderFavoritesBar === "function") renderFavoritesBar();
}

function enterEditor() {
  if (!editMap.length) initEmptyMap(32, 32);
  ensureEditOverlay();
  if (!editBlocks) editBlocks = [];
  gameState = "editor";
  document.body.classList.add("editor-mode");
  COLS = editCols;
  ROWS = editRows;
  resizeCanvas();
  document.getElementById("editCols").value = editCols;
  document.getElementById("editRows").value = editRows;
  buildPalette();
  if (typeof editViewSize !== "number" || editViewSize < 8) editViewSize = 32;
  editCamX = 0;
  editCamY = 0;
  if (typeof renderFavoritesBar === "function") renderFavoritesBar();
  if (typeof applyEditZoom === "function") applyEditZoom();
  else resizeCanvas();
  if (typeof setBrushSize === "function") setBrushSize(brushSize);
  if (typeof updateLayerUI === "function") updateLayerUI();
  hideAllScreens();
  editorBar.classList.remove("hidden");
  if (typeof setPauseBtnVisible === "function") setPauseBtnVisible(false);
  statusEl.textContent = "Editor — layers · Shift+wheel zoom · MMB pan · 0–9 fav · [ ] brush · Esc menu";
  levelNumEl.textContent = "Edit";
  levelTotalEl.textContent = "—";
  try {
    if (window.matchMedia && window.matchMedia("(max-width: 700px)").matches) {
      document.querySelectorAll(".ed-nav-btn").forEach(function (b) {
        var on = b.dataset.edPanel === "palette";
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".ed-panel").forEach(function (p) {
        p.classList.toggle("ed-panel-active", p.dataset.edPanel === "palette");
      });
    }
  } catch (e) {}
  var activeBtn = document.querySelector("#palette .palette-btn.active");
  if (activeBtn && !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
    setTimeout(function () { activeBtn.focus(); }, 0);
  }
}
function canvasToTile(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  var ox = (typeof editCamX === "number") ? editCamX : 0;
  var oy = (typeof editCamY === "number") ? editCamY : 0;
  return {
    x: Math.floor(((clientX - rect.left) * scaleX) / TILE) + ox,
    y: Math.floor(((clientY - rect.top) * scaleY) / TILE) + oy
  };
}
function paintAt(clientX, clientY) {
  if (gameState !== "editor") return;
  const { x, y } = canvasToTile(clientX, clientY);
  if (x < 0 || y < 0 || x >= editCols || y >= editRows) return;
  if (typeof paintBrushAt === "function") paintBrushAt(x, y);
  else setEditChar(x, y, selectedTile);
}

function getLevelData() {
  ensureEditOverlay();
  var hasOverlay = false;
  for (var y = 0; y < editRows; y++) {
    var row = editOverlay[y] || "";
    for (var x = 0; x < editCols; x++) {
      var och = (typeof cellId === "function") ? cellId(row, x, EMPTY_ID) : EMPTY_ID;
      if (och && och !== EMPTY_ID && och !== "  ") { hasOverlay = true; break; }
    }
    if (hasOverlay) break;
  }
  var data = {
    name: "Custom Level",
    cols: editCols,
    rows: editRows,
    map: editMap.slice(),
    version: 4
  };
  if (hasOverlay) data.overlay = editOverlay.slice();
  if (editBlocks && editBlocks.length) {
    data.blocks = editBlocks.map(function (b) { return { x: b.x, y: b.y }; });
  }
  return data;
}

function loadIntoEditor(data) {
  if (!data) return;
  var raw0 = data.map && data.map[0];
  var cols = data.cols || (raw0 ? (typeof rowCols === "function" ? rowCols(raw0) : Math.floor(String(raw0).length / 2) || String(raw0).length) : 20);
  var rows = data.rows || (data.map && data.map.length) || 15;
  editCols = cols;
  editRows = rows;
  if (data.overlay || data.blocks) {
    editMap = (data.map || []).map(function (r) {
      var s = (typeof migrateLegacyRow === "function") ? migrateLegacyRow(String(r)) : String(r);
      var need = cols * 2;
      while (s.length < need) s += FLOOR_ID;
      return s.slice(0, need);
    });
    while (editMap.length < rows) {
      var er = "";
      for (var i = 0; i < cols; i++) er += FLOOR_ID;
      editMap.push(er);
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
        var eo = "";
        for (var j = 0; j < cols; j++) eo += EMPTY_ID;
        editOverlay.push(eo);
      }
      editOverlay.length = rows;
    } else {
      editOverlay = [];
      ensureEditOverlay();
    }
    editBlocks = (data.blocks || []).map(function (b) { return { x: b.x, y: b.y }; });
  } else {
    var split = splitMapIntoLayers(data.map || [], cols, rows);
    editMap = split.map;
    editOverlay = split.overlay;
    editBlocks = split.blocks;
  }
  editLayer = "base";
  if (typeof updateLayerUI === "function") updateLayerUI();
}

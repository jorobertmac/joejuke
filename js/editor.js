/**
 * Joe's Juke — level editor (layered: base / item / block)
 */
"use strict";

var PALETTE_ICONS = {
  ".": "resources/tiles/terrain_floor.png", "W": "resources/tiles/terrain_wall.png", "~": "resources/tiles/terrain_water.png",
  "F": "resources/tiles/terrain_fire.png", "I": "resources/tiles/terrain_ice.png", "1": "resources/tiles/terrain_ice_nw.png",
  "3": "resources/tiles/terrain_ice_ne.png", "7": "resources/tiles/terrain_ice_sw.png", "9": "resources/tiles/terrain_ice_se.png",
  "^": "resources/tiles/terrain_force_n.png", ">": "resources/tiles/terrain_force_e.png", "v": "resources/tiles/terrain_force_s.png",
  "<": "resources/tiles/terrain_force_w.png", "R": "resources/tiles/terrain_force_r.png", "D": "resources/tiles/terrain_dirt.png",
  "G": "resources/tiles/terrain_gravel.png", "E": "resources/tiles/terrain_exit.png", "X": "resources/tiles/terrain_socket.png",
  "C": "resources/tiles/item_chip.png", "?": "resources/tiles/terrain_hint.png", "i": "resources/tiles/terrain_invis.png",
  "h": "resources/tiles/terrain_hidden.png", "r": "resources/tiles/terrain_recessed.png", "[": "resources/tiles/terrain_blue_real.png",
  "]": "resources/tiles/terrain_blue_fake.png", "N": "resources/tiles/terrain_thin_n.png", "Y": "resources/tiles/terrain_thin_e.png",
  "H": "resources/tiles/terrain_thin_s.png", "Z": "resources/tiles/terrain_thin_w.png", "@": "resources/tiles/terrain_teleport.png",
  "*": "resources/tiles/terrain_bomb.png", "$": "resources/tiles/terrain_thief.png", "=": "resources/tiles/terrain_trap_closed.png",
  "|": "resources/tiles/terrain_toggle_wall.png", "_": "resources/tiles/terrain_toggle_floor.png", "+": "resources/tiles/terrain_cloner.png",
  "!": "resources/tiles/item_btn_green.png", "#": "resources/tiles/item_btn_red.png", "%": "resources/tiles/item_btn_blue.png",
  "&": "resources/tiles/item_btn_brown.png", "2": "resources/tiles/item_key_blue.png", "4": "resources/tiles/item_key_red.png",
  "6": "resources/tiles/item_key_green.png", "8": "resources/tiles/item_key_yellow.png", "(": "resources/tiles/item_lock_blue.png",
  ")": "resources/tiles/item_lock_red.png", "{": "resources/tiles/item_lock_green.png", "}": "resources/tiles/item_lock_yellow.png",
  "f": "resources/tiles/item_boot_flip.png", "j": "resources/tiles/item_boot_ice.png", "q": "resources/tiles/item_boot_suction.png",
  "l": "resources/tiles/item_boot_fire.png", "B": "resources/tiles/item_block.png", "p": "resources/monsters/ball_e_0.png",
  "P": "resources/monsters/ball_s_0.png", "m": "resources/monsters/glider_e_0.png", "z": "resources/monsters/fireball_e_0.png",
  "a": "resources/monsters/bug_n_0.png", "c": "resources/monsters/paramecium_n_0.png", "t": "resources/monsters/tank_e_0.png",
  "k": "resources/monsters/walker_e_0.png", "T": "resources/monsters/teeth_s_0.png", "x": "resources/monsters/blob_e_0.png",
  "A": "resources/sprites/joe_s_idle.png"
};

function ensureEditOverlay() {
  if (!editOverlay) editOverlay = [];
  while (editOverlay.length < editRows) {
    editOverlay.push(new Array(editCols + 1).join(" "));
  }
  for (var y = 0; y < editRows; y++) {
    var row = editOverlay[y] || "";
    if (row.length < editCols) row = row + new Array(editCols - row.length + 1).join(" ");
    else if (row.length > editCols) row = row.slice(0, editCols);
    editOverlay[y] = row;
  }
  editOverlay.length = editRows;
}

function setOverlayChar(x, y, ch) {
  ensureEditOverlay();
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  var c = (ch && ch !== ".") ? ch : " ";
  editOverlay[y] = editOverlay[y].substring(0, x) + c + editOverlay[y].substring(x + 1);
}

function getOverlayChar(x, y) {
  if (!editOverlay || y < 0 || y >= editRows || x < 0 || x >= editCols) return " ";
  var row = editOverlay[y] || "";
  return row[x] || " ";
}

function hasEditBlock(x, y) {
  return editBlocks.some(function (b) { return b.x === x && b.y === y; });
}

function setEditBlock(x, y, on) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  editBlocks = editBlocks.filter(function (b) { return !(b.x === x && b.y === y); });
  if (on) editBlocks.push({ x: x, y: y });
}

function splitMapIntoLayers(srcMap, cols, rows) {
  var base = [], ov = [], blks = [];
  for (var y = 0; y < rows; y++) {
    var src = (srcMap && srcMap[y]) ? srcMap[y] : "";
    var bRow = "", oRow = "";
    for (var x = 0; x < cols; x++) {
      var ch = src[x] || ".";
      if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
        bRow += "."; oRow += ch;
      } else if (ch === "B") {
        bRow += "."; oRow += " "; blks.push({ x: x, y: y });
      } else {
        bRow += ch; oRow += " ";
      }
    }
    base.push(bRow); ov.push(oRow);
  }
  return { map: base, overlay: ov, blocks: blks };
}

function initEmptyMap(cols, rows) {
  editCols = cols; editRows = rows; editMap = []; editOverlay = []; editBlocks = [];
  for (let y = 0; y < rows; y++) {
    let row = "", oRow = "";
    for (let x = 0; x < cols; x++) {
      row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "W" : ".";
      oRow += " ";
    }
    editMap.push(row); editOverlay.push(oRow);
  }
  var prev = editLayer;
  editLayer = "base";
  setEditChar(1, 1, "A");
  setEditChar(cols - 2, rows - 2, "E");
  editLayer = prev || "base";
  if (typeof updateLayerUI === "function") updateLayerUI();
}

function setEditChar(x, y, ch) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  ensureEditOverlay();
  var layer = editLayer || "base";
  if (layer === "item") {
    if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) setOverlayChar(x, y, ch);
    else setOverlayChar(x, y, " ");
    return;
  }
  if (layer === "block") {
    setEditBlock(x, y, ch === "B");
    return;
  }
  if (typeof isItemLayerChar === "function" && isItemLayerChar(ch)) {
    if (editMap[y][x] !== "A" && editMap[y][x] !== "E") {
      editMap[y] = editMap[y].substring(0, x) + "." + editMap[y].substring(x + 1);
    }
    setOverlayChar(x, y, ch);
    return;
  }
  if (ch === "B") {
    if (editMap[y][x] !== "A" && editMap[y][x] !== "E") {
      editMap[y] = editMap[y].substring(0, x) + "." + editMap[y].substring(x + 1);
    }
    setEditBlock(x, y, true);
    return;
  }
  if (ch === "A" || ch === "E") {
    for (let yy = 0; yy < editRows; yy++)
      for (let xx = 0; xx < editCols; xx++)
        if (editMap[yy][xx] === ch)
          editMap[yy] = editMap[yy].substring(0, xx) + "." + editMap[yy].substring(xx + 1);
  }
  editMap[y] = editMap[y].substring(0, x) + ch + editMap[y].substring(x + 1);
  if (ch === "W" || ch === "~" || ch === "F") {
    setOverlayChar(x, y, " ");
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

function paletteKeyLabel(ch) {
  if (ch === " ") return "Sp";
  if (ch >= "0" && ch <= "9") return "";
  return ch;
}

function buildPalette() {
  const palette = document.getElementById("palette");
  if (!palette) return;
  palette.innerHTML = "";
  ALL_CHARS.forEach(ch => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn" + (ch === selectedTile ? " active" : "");
    btn.dataset.ch = ch;
    const label = TILE_LABELS[ch] || ch;
    btn.title = label + " (" + ch + ")";
    btn.setAttribute("aria-label", label);
    const iconSrc = PALETTE_ICONS[ch];
    if (iconSrc) {
      const img = document.createElement("img");
      img.src = iconSrc; img.alt = ""; img.className = "palette-icon"; img.draggable = false; img.loading = "lazy";
      img.onerror = function () {
        this.style.display = "none";
        if (!btn.querySelector(".palette-fallback")) {
          const fb = document.createElement("span");
          fb.className = "palette-fallback";
          fb.textContent = ch === "." ? "·" : ch;
          btn.insertBefore(fb, btn.firstChild);
        }
      };
      btn.appendChild(img);
    } else {
      const fb = document.createElement("span");
      fb.className = "palette-fallback";
      fb.textContent = ch === "." ? "·" : ch;
      btn.appendChild(fb);
    }
    const key = document.createElement("span");
    key.className = "palette-key";
    key.textContent = paletteKeyLabel(ch);
    btn.appendChild(key);
    btn.draggable = true;
    btn.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/joejuke-tile", ch);
      e.dataTransfer.setData("text/plain", ch);
      e.dataTransfer.effectAllowed = "copy";
    });
    btn.addEventListener("click", function (e) {
      if (e.shiftKey) {
        e.preventDefault();
        if (typeof toggleFavoriteFromPalette === "function") toggleFavoriteFromPalette(ch);
        return;
      }
      selectedTile = ch;
      palette.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      statusEl.textContent = "Paint: " + label;
      btn.focus();
    });
    btn.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); btn.click(); }
    });
    palette.appendChild(btn);
  });
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
  COLS = editCols; ROWS = editRows;
  resizeCanvas();
  document.getElementById("editCols").value = editCols;
  document.getElementById("editRows").value = editRows;
  buildPalette();
  if (typeof editViewSize !== "number" || editViewSize < 8) editViewSize = 32;
  editCamX = 0; editCamY = 0;
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
  var activeBtn = document.querySelector("#palette .palette-btn.active");
  if (activeBtn) setTimeout(function () { activeBtn.focus(); }, 0);
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
      if (row[x] && row[x] !== " ") { hasOverlay = true; break; }
    }
    if (hasOverlay) break;
  }
  var data = { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 4 };
  if (hasOverlay) data.overlay = editOverlay.slice();
  if (editBlocks && editBlocks.length) {
    data.blocks = editBlocks.map(function (b) { return { x: b.x, y: b.y }; });
  }
  return data;
}

function loadIntoEditor(data) {
  if (!data) return;
  var cols = data.cols || (data.map && data.map[0] && data.map[0].length) || 20;
  var rows = data.rows || (data.map && data.map.length) || 15;
  editCols = cols; editRows = rows;
  if (data.overlay || data.blocks) {
    editMap = (data.map || []).map(function (r) { return String(r).padEnd(cols, ".").slice(0, cols); });
    while (editMap.length < rows) editMap.push(new Array(cols + 1).join("."));
    editMap.length = rows;
    if (data.overlay) {
      editOverlay = data.overlay.map(function (r) {
        return String(r).padEnd(cols, " ").slice(0, cols).replace(/\./g, " ");
      });
      while (editOverlay.length < rows) editOverlay.push(new Array(cols + 1).join(" "));
      editOverlay.length = rows;
    } else {
      editOverlay = [];
      ensureEditOverlay();
    }
    editBlocks = Array.isArray(data.blocks)
      ? data.blocks.map(function (b) { return { x: b.x, y: b.y }; })
      : [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        if (editMap[y][x] === "B") {
          editMap[y] = editMap[y].substring(0, x) + "." + editMap[y].substring(x + 1);
          if (!hasEditBlock(x, y)) editBlocks.push({ x: x, y: y });
        }
        if (typeof isItemLayerChar === "function" && isItemLayerChar(editMap[y][x])) {
          setOverlayChar(x, y, editMap[y][x]);
          editMap[y] = editMap[y].substring(0, x) + "." + editMap[y].substring(x + 1);
        }
      }
    }
  } else {
    var split = splitMapIntoLayers(data.map || data, cols, rows);
    editMap = split.map;
    editOverlay = split.overlay;
    editBlocks = split.blocks;
  }
  COLS = editCols; ROWS = editRows;
}

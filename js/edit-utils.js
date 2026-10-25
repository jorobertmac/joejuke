/**
 * Joe's Juke — editor utilities (zoom, brush, favorites, layers, pan)
 */
"use strict";

var BRUSH_SIZES = [1, 3, 5];
var EDIT_VIEW_MIN = 8;
var EDIT_VIEW_MAX = 100;
var EDIT_VIEW_STEP = 4;
var EDIT_VIEW_DEFAULT = 32;

function clampEditViewSize(n) {
  n = Math.round(n / EDIT_VIEW_STEP) * EDIT_VIEW_STEP;
  return Math.max(EDIT_VIEW_MIN, Math.min(EDIT_VIEW_MAX, n));
}

function clampEditCam() {
  var vs = editViewSize || EDIT_VIEW_DEFAULT;
  var maxX = Math.max(0, editCols - vs);
  var maxY = Math.max(0, editRows - vs);
  editCamX = Math.max(0, Math.min(maxX, editCamX | 0));
  editCamY = Math.max(0, Math.min(maxY, editCamY | 0));
}

function applyEditZoom() {
  editViewSize = clampEditViewSize(editViewSize || EDIT_VIEW_DEFAULT);
  clampEditCam();
  var lab = document.getElementById("zoomLabel");
  if (lab) lab.textContent = editViewSize + "×" + editViewSize;
  if (typeof resizeCanvas === "function") resizeCanvas();
}

function zoomIn(cx, cy) {
  if (gameState !== "editor") return;
  var old = editViewSize;
  editViewSize = clampEditViewSize(editViewSize - EDIT_VIEW_STEP);
  if (editViewSize === old) return;
  applyEditZoom();
}

function zoomOut(cx, cy) {
  if (gameState !== "editor") return;
  var old = editViewSize;
  editViewSize = clampEditViewSize(editViewSize + EDIT_VIEW_STEP);
  if (editViewSize === old) return;
  applyEditZoom();
}

function zoomReset() {
  editViewSize = EDIT_VIEW_DEFAULT;
  editCamX = 0; editCamY = 0;
  applyEditZoom();
}

function setBrushSize(n) {
  n = parseInt(n, 10);
  if (BRUSH_SIZES.indexOf(n) < 0) n = 1;
  brushSize = n;
  document.querySelectorAll(".brush-btn").forEach(function (b) {
    b.classList.toggle("active", parseInt(b.dataset.size, 10) === brushSize);
  });
  var lab = document.getElementById("brushLabel");
  if (lab) lab.textContent = brushSize + "×" + brushSize;
}

function cycleBrushSize(dir) {
  var i = BRUSH_SIZES.indexOf(brushSize);
  if (i < 0) i = 0;
  i = (i + dir + BRUSH_SIZES.length) % BRUSH_SIZES.length;
  setBrushSize(BRUSH_SIZES[i]);
}

function paintBrushAt(cx, cy) {
  if (gameState !== "editor") return;
  var half = Math.floor(brushSize / 2);
  var x0 = cx - half, y0 = cy - half;
  for (var dy = 0; dy < brushSize; dy++) {
    for (var dx = 0; dx < brushSize; dx++) {
      setEditChar(x0 + dx, y0 + dy, selectedTile);
    }
  }
}

function favoriteSlotOf(ch) {
  for (var i = 0; i < 10; i++) if (favorites[i] === ch) return i;
  return -1;
}

function firstEmptyFavorite() {
  for (var i = 0; i < 10; i++) if (favorites[i] == null) return i;
  return -1;
}

function setFavorite(slot, ch) {
  slot = slot | 0;
  if (slot < 0 || slot > 9) return;
  if (ch != null && !ALL_CHARS.includes(ch)) return;
  favorites[slot] = ch == null ? null : ch;
  saveFavorites();
  renderFavoritesBar();
}

function selectFavorite(slot) {
  slot = slot | 0;
  if (slot < 0 || slot > 9) return;
  var ch = favorites[slot];
  if (ch == null) return;
  if (typeof selectPaletteTile === "function") selectPaletteTile(ch);
}

function toggleFavoriteFromPalette(ch) {
  var slot = favoriteSlotOf(ch);
  if (slot >= 0) setFavorite(slot, null);
  else {
    var empty = firstEmptyFavorite();
    if (empty >= 0) setFavorite(empty, ch);
  }
}

function loadFavorites() {
  try {
    var raw = localStorage.getItem("joejuke_favorites");
    if (!raw) return;
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (var i = 0; i < 10; i++) {
      favorites[i] = (arr[i] && ALL_CHARS.includes(arr[i])) ? arr[i] : null;
    }
  } catch (e) {}
}

function saveFavorites() {
  try {
    localStorage.setItem("joejuke_favorites", JSON.stringify(favorites));
  } catch (e) {}
}

function renderFavoritesBar() {
  var bar = document.getElementById("favoritesBar");
  if (!bar) return;
  bar.innerHTML = "";
  for (var i = 0; i < 10; i++) {
    (function (slot) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fav-slot" + (favorites[slot] == null ? " empty" : "");
      btn.dataset.slot = String(slot);
      var key = document.createElement("span");
      key.className = "fav-key";
      key.textContent = String(slot);
      btn.appendChild(key);
      var ch = favorites[slot];
      if (ch) {
        var icons = (typeof PALETTE_ICONS !== "undefined") ? PALETTE_ICONS : null;
        if (icons && icons[ch]) {
          var img = document.createElement("img");
          img.src = icons[ch]; img.alt = ""; img.className = "fav-icon"; img.draggable = false;
          btn.appendChild(img);
        } else {
          var fb = document.createElement("span");
          fb.className = "fav-fallback";
          fb.textContent = ch === "." ? "·" : ch;
          btn.appendChild(fb);
        }
      } else {
        var em = document.createElement("span");
        em.className = "fav-empty";
        em.textContent = "+";
        btn.appendChild(em);
      }
      btn.addEventListener("click", function () {
        if (favorites[slot]) selectFavorite(slot);
        else if (selectedTile) setFavorite(slot, selectedTile);
      });
      btn.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        setFavorite(slot, null);
      });
      bar.appendChild(btn);
    })(i);
  }
}

function eyedropAt(clientX, clientY) {
  if (gameState !== "editor") return;
  var t = canvasToTile(clientX, clientY);
  if (t.x < 0 || t.y < 0 || t.x >= editCols || t.y >= editRows) return;
  var layer = editLayer || "base";
  var ch = ".";
  if (layer === "item") {
    ch = (typeof getOverlayChar === "function") ? getOverlayChar(t.x, t.y) : " ";
    if (!ch || ch === " ") ch = ".";
  } else if (layer === "block") {
    ch = (typeof hasEditBlock === "function" && hasEditBlock(t.x, t.y)) ? "B" : ".";
  } else {
    ch = (editMap[t.y] && editMap[t.y][t.x]) || ".";
  }
  if (typeof selectPaletteTile === "function") selectPaletteTile(ch);
  if (statusEl) statusEl.textContent = "Eyedrop (" + layer + "): " + (TILE_LABELS[ch] || ch);
}

function startEditPan(clientX, clientY) {
  editPanning = true;
  editPanStartX = clientX;
  editPanStartY = clientY;
  editPanCamX = editCamX;
  editPanCamY = editCamY;
  if (canvas) canvas.style.cursor = "grabbing";
}

function moveEditPan(clientX, clientY) {
  if (!editPanning || !canvas) return;
  var rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  var vs = editViewSize || EDIT_VIEW_DEFAULT;
  var dxTiles = ((clientX - editPanStartX) / rect.width) * vs;
  var dyTiles = ((clientY - editPanStartY) / rect.height) * vs;
  editCamX = Math.round(editPanCamX - dxTiles);
  editCamY = Math.round(editPanCamY - dyTiles);
  clampEditCam();
}

function endEditPan() {
  if (!editPanning) return;
  editPanning = false;
  if (canvas) canvas.style.cursor = "";
}

function initEditUtils() {
  loadFavorites();
  renderFavoritesBar();
  setBrushSize(brushSize);
  editViewSize = clampEditViewSize(editViewSize || EDIT_VIEW_DEFAULT);
  applyEditZoom();

  var zin = document.getElementById("zoomInBtn");
  var zout = document.getElementById("zoomOutBtn");
  var zrst = document.getElementById("zoomResetBtn");
  if (zin) zin.addEventListener("click", function (e) { e.preventDefault(); zoomIn(); });
  if (zout) zout.addEventListener("click", function (e) { e.preventDefault(); zoomOut(); });
  if (zrst) zrst.addEventListener("click", function (e) { e.preventDefault(); zoomReset(); });

  document.querySelectorAll(".brush-btn").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      setBrushSize(b.dataset.size);
    });
  });

  document.querySelectorAll(".layer-btn").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (typeof setEditLayer === "function") setEditLayer(b.dataset.layer);
      else {
        editLayer = b.dataset.layer;
        document.querySelectorAll(".layer-btn").forEach(function (x) {
          x.classList.toggle("active", x.dataset.layer === editLayer);
        });
      }
    });
  });
  if (typeof updateLayerUI === "function") updateLayerUI();

  var wrap = document.getElementById("canvas-wrap");
  var target = wrap || canvas;
  if (target) {
    target.addEventListener("wheel", function (e) {
      if (gameState !== "editor") return;
      if (!(e.shiftKey || e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn(e.clientX, e.clientY);
      else zoomOut(e.clientX, e.clientY);
    }, { passive: false });

    target.addEventListener("mousedown", function (e) {
      if (gameState !== "editor") return;
      if (e.button === 1) {
        e.preventDefault();
        startEditPan(e.clientX, e.clientY);
      }
    });
    window.addEventListener("mousemove", function (e) {
      if (editPanning) {
        e.preventDefault();
        moveEditPan(e.clientX, e.clientY);
      }
    });
    window.addEventListener("mouseup", function (e) {
      if (e.button === 1 || editPanning) endEditPan();
    });
    target.addEventListener("auxclick", function (e) {
      if (gameState === "editor" && e.button === 1) e.preventDefault();
    });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEditUtils);
  } else {
    setTimeout(initEditUtils, 0);
  }
}

/**
 * Joe's Juke — editor utilities: tile viewport zoom/pan, brush, favorites (0–9)
 * Zoom changes displayed tile count (8…100 by 4); on-screen map footprint stays fixed.
 */
"use strict";

var EDIT_VIEW_MIN = 8;
var EDIT_VIEW_MAX = 100;
var EDIT_VIEW_STEP = 4;
var EDIT_VIEW_DEFAULT = 32;
var BRUSH_SIZES = [1, 3, 5];

function clampEditViewSize(n) {
  n = Math.round(n / EDIT_VIEW_STEP) * EDIT_VIEW_STEP;
  return Math.max(EDIT_VIEW_MIN, Math.min(EDIT_VIEW_MAX, n));
}

function clampEditCam() {
  var vs = editViewSize || EDIT_VIEW_DEFAULT;
  var cols = editCols || 32;
  var rows = editRows || 32;
  if (cols <= vs) editCamX = Math.floor((cols - vs) / 2);
  else editCamX = Math.max(0, Math.min(cols - vs, editCamX | 0));
  if (rows <= vs) editCamY = Math.floor((rows - vs) / 2);
  else editCamY = Math.max(0, Math.min(rows - vs, editCamY | 0));
}

function applyEditZoom() {
  var wrap = document.getElementById("canvas-wrap");
  if (wrap) {
    wrap.style.transform = "";
    wrap.style.transformOrigin = "";
  }
  if (typeof gameState !== "undefined" && gameState === "editor") {
    editViewSize = clampEditViewSize(editViewSize || EDIT_VIEW_DEFAULT);
    clampEditCam();
    if (typeof resizeCanvas === "function") resizeCanvas();
  }
  var label = document.getElementById("zoomLabel");
  if (label) label.textContent = editViewSize + "×" + editViewSize;
}

function setEditViewSize(n, anchorClientX, anchorClientY) {
  var old = editViewSize;
  var next = clampEditViewSize(n);
  if (next === old) {
    applyEditZoom();
    return;
  }
  var ax = editCamX + Math.floor(old / 2);
  var ay = editCamY + Math.floor(old / 2);
  if (anchorClientX != null && typeof canvasToTile === "function" && canvas) {
    var t = canvasToTile(anchorClientX, anchorClientY);
    if (t && !isNaN(t.x) && !isNaN(t.y)) {
      ax = t.x;
      ay = t.y;
    }
  }
  editViewSize = next;
  editCamX = ax - Math.floor(next / 2);
  editCamY = ay - Math.floor(next / 2);
  clampEditCam();
  applyEditZoom();
  if (statusEl) statusEl.textContent = "View " + editViewSize + "×" + editViewSize;
}

function zoomIn(ax, ay) {
  setEditViewSize(editViewSize - EDIT_VIEW_STEP, ax, ay);
}
function zoomOut(ax, ay) {
  setEditViewSize(editViewSize + EDIT_VIEW_STEP, ax, ay);
}
function zoomReset() {
  setEditViewSize(EDIT_VIEW_DEFAULT);
}

function setBrushSize(n) {
  n = parseInt(n, 10);
  if (BRUSH_SIZES.indexOf(n) < 0) n = 1;
  brushSize = n;
  document.querySelectorAll(".brush-btn").forEach(function (b) {
    b.classList.toggle("active", parseInt(b.dataset.size, 10) === brushSize);
  });
  var bl = document.getElementById("brushLabel");
  if (bl) bl.textContent = brushSize + "×" + brushSize;
  if (statusEl) statusEl.textContent = "Brush " + brushSize + "×" + brushSize;
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
  renderFavoritesBar();
  try {
    localStorage.setItem("joejuke_favorites", JSON.stringify(favorites));
  } catch (_) {}
}

function loadFavorites() {
  try {
    var raw = localStorage.getItem("joejuke_favorites");
    if (!raw) return;
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (var i = 0; i < 10; i++) {
      var v = arr[i];
      favorites[i] = (v != null && ALL_CHARS.includes(v)) ? v : null;
    }
  } catch (_) {}
}

function toggleFavoriteFromPalette(ch) {
  if (!ALL_CHARS.includes(ch)) return;
  var idx = favoriteSlotOf(ch);
  if (idx >= 0) {
    setFavorite(idx, null);
    if (statusEl) statusEl.textContent = "Removed from favorites";
    return;
  }
  var empty = firstEmptyFavorite();
  if (empty < 0) {
    if (statusEl) statusEl.textContent = "Favorites full (0–9)";
    return;
  }
  setFavorite(empty, ch);
  if (statusEl) statusEl.textContent = "Favorite " + empty + ": " + (TILE_LABELS[ch] || ch);
}

function selectFavorite(slot) {
  slot = slot | 0;
  if (slot < 0 || slot > 9) return;
  var ch = favorites[slot];
  if (ch == null) {
    if (statusEl) statusEl.textContent = "Favorite " + slot + " empty";
    return;
  }
  if (typeof selectPaletteTile === "function") selectPaletteTile(ch);
  else {
    selectedTile = ch;
    document.querySelectorAll(".palette-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.ch === selectedTile);
    });
  }
  document.querySelectorAll(".fav-slot").forEach(function (b) {
    b.classList.toggle("active", parseInt(b.dataset.slot, 10) === slot);
  });
}

function favIconHtml(ch) {
  if (ch == null) return '<span class="fav-empty">·</span>';
  var src = (typeof PALETTE_ICONS !== "undefined" && PALETTE_ICONS[ch]) ? PALETTE_ICONS[ch] : null;
  if (src) return '<img class="fav-icon" src="' + src + '" alt="" draggable="false">';
  return '<span class="fav-fallback">' + (ch === "." ? "·" : ch) + "</span>";
}

function renderFavoritesBar() {
  var bar = document.getElementById("favoritesBar");
  if (!bar) return;
  bar.innerHTML = "";
  for (var i = 0; i < 10; i++) {
    (function (slot) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fav-slot" + (favorites[slot] ? "" : " empty");
      btn.dataset.slot = String(slot);
      btn.title = favorites[slot]
        ? ("Fav " + slot + ": " + (TILE_LABELS[favorites[slot]] || favorites[slot]))
        : ("Favorite " + slot + " (empty) — drop a tile here");
      btn.innerHTML = '<span class="fav-key">' + slot + "</span>" + favIconHtml(favorites[slot]);
      btn.addEventListener("click", function () { selectFavorite(slot); });
      btn.addEventListener("dragover", function (e) {
        e.preventDefault();
        btn.classList.add("drag-over");
      });
      btn.addEventListener("dragleave", function () { btn.classList.remove("drag-over"); });
      btn.addEventListener("drop", function (e) {
        e.preventDefault();
        btn.classList.remove("drag-over");
        var ch = e.dataTransfer.getData("text/joejuke-tile") || e.dataTransfer.getData("text/plain");
        if (ch && ALL_CHARS.includes(ch)) {
          setFavorite(slot, ch);
          if (statusEl) statusEl.textContent = "Favorite " + slot + ": " + (TILE_LABELS[ch] || ch);
        }
      });
      if (favorites[slot]) {
        btn.draggable = true;
        btn.addEventListener("dragstart", function (e) {
          e.dataTransfer.setData("text/joejuke-tile", favorites[slot]);
          e.dataTransfer.setData("text/plain", favorites[slot]);
          e.dataTransfer.effectAllowed = "copy";
        });
      }
      bar.appendChild(btn);
    })(i);
  }
}

function eyedropAt(clientX, clientY) {
  if (gameState !== "editor") return;
  var t = canvasToTile(clientX, clientY);
  if (t.x < 0 || t.y < 0 || t.x >= editCols || t.y >= editRows) return;
  var ch = (editMap[t.y] && editMap[t.y][t.x]) || ".";
  if (typeof selectPaletteTile === "function") selectPaletteTile(ch);
  if (statusEl) statusEl.textContent = "Eyedrop: " + (TILE_LABELS[ch] || ch);
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

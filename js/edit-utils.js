/**
 * Joe's Juke — editor utilities: zoom, brush size, favorites (0–9)
 */
"use strict";

var EDIT_ZOOM_MIN = 0.5;
var EDIT_ZOOM_MAX = 2;
var EDIT_ZOOM_STEP = 0.25;
var BRUSH_SIZES = [1, 3, 5];

function clampEditZoom(z) {
  z = Math.round(z / EDIT_ZOOM_STEP) * EDIT_ZOOM_STEP;
  return Math.max(EDIT_ZOOM_MIN, Math.min(EDIT_ZOOM_MAX, z));
}

function applyEditZoom() {
  var wrap = document.getElementById("canvas-wrap");
  if (!wrap) return;
  if (typeof gameState !== "undefined" && gameState === "editor") {
    wrap.style.transform = "scale(" + editZoom + ")";
    wrap.style.transformOrigin = "top center";
  } else {
    wrap.style.transform = "";
    wrap.style.transformOrigin = "";
  }
  var label = document.getElementById("zoomLabel");
  if (label) label.textContent = Math.round(editZoom * 100) + "%";
}

function setEditZoom(z) {
  editZoom = clampEditZoom(z);
  applyEditZoom();
  if (statusEl) statusEl.textContent = "Zoom " + Math.round(editZoom * 100) + "%";
}

function zoomIn() { setEditZoom(editZoom + EDIT_ZOOM_STEP); }
function zoomOut() { setEditZoom(editZoom - EDIT_ZOOM_STEP); }
function zoomReset() { setEditZoom(1); }

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

/** Paint selectedTile in a brushSize×brushSize block centered on (cx, cy). */
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

/**
 * Shift+click on palette: remove if already a favorite; else add to first empty.
 * No-op if full and not already stored.
 */
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

function initEditUtils() {
  loadFavorites();
  renderFavoritesBar();
  setBrushSize(brushSize);
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
  if (wrap) {
    wrap.addEventListener("wheel", function (e) {
      if (gameState !== "editor") return;
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }, { passive: false });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEditUtils);
  } else {
    setTimeout(initEditUtils, 0);
  }
}

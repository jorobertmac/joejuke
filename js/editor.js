/**
 * Joe's Juke — level editor
 */
"use strict";

/** Map palette chars to icon image paths (32×32 tiles / monster frames). */
var PALETTE_ICONS = {
  ".": "resources/tiles/terrain_floor.png",
  "W": "resources/tiles/terrain_wall.png",
  "~": "resources/tiles/terrain_water.png",
  "F": "resources/tiles/terrain_fire.png",
  "I": "resources/tiles/terrain_ice.png",
  "1": "resources/tiles/terrain_ice_nw.png",
  "3": "resources/tiles/terrain_ice_ne.png",
  "7": "resources/tiles/terrain_ice_sw.png",
  "9": "resources/tiles/terrain_ice_se.png",
  "^": "resources/tiles/terrain_force_n.png",
  ">": "resources/tiles/terrain_force_e.png",
  "v": "resources/tiles/terrain_force_s.png",
  "<": "resources/tiles/terrain_force_w.png",
  "R": "resources/tiles/terrain_force_r.png",
  "D": "resources/tiles/terrain_dirt.png",
  "G": "resources/tiles/terrain_gravel.png",
  "E": "resources/tiles/terrain_exit.png",
  "X": "resources/tiles/terrain_socket.png",
  "C": "resources/tiles/item_chip.png",
  "?": "resources/tiles/terrain_hint.png",
  "i": "resources/tiles/terrain_invis.png",
  "h": "resources/tiles/terrain_hidden.png",
  "r": "resources/tiles/terrain_recessed.png",
  "[": "resources/tiles/terrain_blue_real.png",
  "]": "resources/tiles/terrain_blue_fake.png",
  "N": "resources/tiles/terrain_thin_n.png",
  "Y": "resources/tiles/terrain_thin_e.png",
  "H": "resources/tiles/terrain_thin_s.png",
  "Z": "resources/tiles/terrain_thin_w.png",
  "@": "resources/tiles/terrain_teleport.png",
  "*": "resources/tiles/terrain_bomb.png",
  "$": "resources/tiles/terrain_thief.png",
  "=": "resources/tiles/terrain_trap_closed.png",
  "|": "resources/tiles/terrain_toggle_wall.png",
  "_": "resources/tiles/terrain_toggle_floor.png",
  "+": "resources/tiles/terrain_cloner.png",
  "!": "resources/tiles/item_btn_green.png",
  "#": "resources/tiles/item_btn_red.png",
  "%": "resources/tiles/item_btn_blue.png",
  "&": "resources/tiles/item_btn_brown.png",
  "2": "resources/tiles/item_key_blue.png",
  "4": "resources/tiles/item_key_red.png",
  "6": "resources/tiles/item_key_green.png",
  "8": "resources/tiles/item_key_yellow.png",
  "(": "resources/tiles/item_lock_blue.png",
  ")": "resources/tiles/item_lock_red.png",
  "{": "resources/tiles/item_lock_green.png",
  "}": "resources/tiles/item_lock_yellow.png",
  "f": "resources/tiles/item_boot_flip.png",
  "j": "resources/tiles/item_boot_ice.png",
  "q": "resources/tiles/item_boot_suction.png",
  "l": "resources/tiles/item_boot_fire.png",
  "B": "resources/tiles/item_block.png",
  "p": "resources/monsters/ball_e_0.png",
  "P": "resources/monsters/ball_s_0.png",
  "m": "resources/monsters/glider_e_0.png",
  "z": "resources/monsters/fireball_e_0.png",
  "a": "resources/monsters/bug_n_0.png",
  "c": "resources/monsters/paramecium_n_0.png",
  "t": "resources/monsters/tank_e_0.png",
  "k": "resources/monsters/walker_e_0.png",
  "T": "resources/monsters/teeth_s_0.png",
  "x": "resources/monsters/blob_e_0.png",
  "A": "resources/sprites/joe_s_idle.png",
};

function initEmptyMap(cols, rows) {
  editCols = cols; editRows = rows; editMap = [];
  for (let y = 0; y < rows; y++) {
    let row = "";
    for (let x = 0; x < cols; x++)
      row += (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) ? "W" : ".";
    editMap.push(row);
  }
  setEditChar(1, 1, "A");
  setEditChar(cols - 2, rows - 2, "E");
}
function setEditChar(x, y, ch) {
  if (y < 0 || y >= editRows || x < 0 || x >= editCols) return;
  if (ch === "A" || ch === "E") {
    for (let yy = 0; yy < editRows; yy++)
      for (let xx = 0; xx < editCols; xx++)
        if (editMap[yy][xx] === ch)
          editMap[yy] = editMap[yy].substring(0, xx) + "." + editMap[yy].substring(xx + 1);
  }
  editMap[y] = editMap[y].substring(0, x) + ch + editMap[y].substring(x + 1);
}

/**
 * Palette shortcut labels. Digits 0–9 are reserved for Favorites,
 * so tiles whose map char is a digit show no key hint.
 */
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
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        btn.click();
      }
    });
    palette.appendChild(btn);
  });
  var activeBtn = palette.querySelector(".palette-btn.active");
  if (activeBtn) activeBtn.setAttribute("tabindex", "0");
  if (typeof renderFavoritesBar === "function") renderFavoritesBar();
}

function enterEditor() {
  if (!editMap.length) initEmptyMap(32, 32);
  // Set editor state before resize so canvas uses full map size (not 9x9 FOV).
  gameState = "editor";
  document.body.classList.add("editor-mode");
  COLS = editCols;
  ROWS = editRows;
  resizeCanvas();
  document.getElementById("editCols").value = editCols;
  document.getElementById("editRows").value = editRows;
  buildPalette();
  if (typeof renderFavoritesBar === "function") renderFavoritesBar();
  if (typeof applyEditZoom === "function") applyEditZoom();
  if (typeof setBrushSize === "function") setBrushSize(brushSize);
  hideAllScreens();
  editorBar.classList.remove("hidden");
  if (typeof setPauseBtnVisible === "function") setPauseBtnVisible(false);
  statusEl.textContent = "Editor — 0–9 favorites · [ ] brush · +/- zoom · Shift+click fav · Esc menu";
  levelNumEl.textContent = "Edit";
  levelTotalEl.textContent = "—";
  var activeBtn = document.querySelector("#palette .palette-btn.active");
  if (activeBtn) {
    setTimeout(function () { activeBtn.focus(); }, 0);
  }
}
function canvasToTile(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  return {
    x: Math.floor(((clientX - rect.left) * scaleX) / TILE),
    y: Math.floor(((clientY - rect.top) * scaleY) / TILE)
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
  return { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 3 };
}

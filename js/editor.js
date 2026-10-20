/**
 * Joe's Juke — level editor
 */
"use strict";

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
function buildPalette() {
  const palette = document.getElementById("palette");
  palette.innerHTML = "";
  ALL_CHARS.forEach(ch => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn" + (ch === selectedTile ? " active" : "");
    btn.dataset.ch = ch;
    btn.title = TILE_LABELS[ch] || ch;
    btn.textContent = ch === "." ? "·" : ch;
    btn.addEventListener("click", () => {
      selectedTile = ch;
      palette.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      statusEl.textContent = "Paint: " + (TILE_LABELS[ch] || ch);
    });
    palette.appendChild(btn);
  });
}
function enterEditor() {
  if (!editMap.length) initEmptyMap(20, 15);
  COLS = editCols; ROWS = editRows; resizeCanvas();
  document.getElementById("editCols").value = editCols;
  document.getElementById("editRows").value = editRows;
  buildPalette();
  gameState = "editor";
  hideAllScreens();
  editorBar.classList.remove("hidden");
  document.body.classList.add("editor-mode");
  statusEl.textContent = "Editor";
  levelNumEl.textContent = "Edit";
  levelTotalEl.textContent = "—";
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
  setEditChar(x, y, selectedTile);
}
function getLevelData() {
  return { name: "Custom Level", cols: editCols, rows: editRows, map: editMap.slice(), version: 3 };
}

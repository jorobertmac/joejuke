(() => {
  "use strict";
  window.__JOEJUKE_READY__ = false;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const TILE = 32;
  let COLS = 20, ROWS = 15;
  const statusEl = document.getElementById("status");
  const startScreen = document.getElementById("startScreen");
  const levelComplete = document.getElementById("levelComplete");
  const gameOver = document.getElementById("gameOver");
  const winScreen = document.getElementById("winScreen");
  const editorBar = document.getElementById("editorBar");
  const exportModal = document.getElementById("exportModal");
  const importModal = document.getElementById("importModal");
  let gameState = "start";
  function hideAllScreens() {
    [startScreen, levelComplete, gameOver, winScreen, exportModal, importModal]
      .forEach(el => el && el.classList.add("hidden"));
    if (editorBar) editorBar.classList.add("hidden");
  }
  function loadLevel(n) {
    gameState = "play";
    hideAllScreens();
    statusEl.textContent = "Level " + (n+1) + " — full game.js not yet synced; restore from local artifacts.";
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#4ecca3";
    ctx.font = "14px monospace";
    ctx.fillText("Game body pending full push. Use local game.js.", 20, 40);
  }
  function enterEditor() {
    gameState = "editor";
    hideAllScreens();
    if (editorBar) editorBar.classList.remove("hidden");
    document.body.classList.add("editor-mode");
    statusEl.textContent = "Editor (stub)";
  }
  function on(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", e => { e.preventDefault(); handler(e); });
  }
  on("startBtn", () => loadLevel(0));
  on("editorBtn", () => enterEditor());
  on("importStartBtn", () => {
    if (importModal) { hideAllScreens(); importModal.classList.remove("hidden"); }
  });
  on("nextBtn", () => loadLevel(1));
  on("retryBtn", () => loadLevel(0));
  on("restartBtn", () => loadLevel(0));
  on("exitEditorBtn", () => {
    gameState = "start"; hideAllScreens();
    if (startScreen) startScreen.classList.remove("hidden");
    document.body.classList.remove("editor-mode");
  });
  on("closeImportBtn", () => {
    hideAllScreens();
    if (startScreen) startScreen.classList.remove("hidden");
  });
  on("closeExportBtn", () => {
    hideAllScreens();
    if (editorBar) editorBar.classList.remove("hidden");
  });
  canvas.width = COLS * TILE; canvas.height = ROWS * TILE;
  window.__JOEJUKE_READY__ = true;
})();

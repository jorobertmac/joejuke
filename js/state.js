/**
 * Joe's Juke — shared game state and HUD
 */
"use strict";

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var assets = {
  ready: false,
  terrain: null,
  items: null,
  joe: null,
  block: null,
  monsters: {},
};

var COLS = 20, ROWS = 15;

var levelNumEl = document.getElementById("levelNum");
var levelTotalEl = document.getElementById("levelTotal");
var chipCountEl = document.getElementById("chipCount");
var chipsNeededDisplayEl = document.getElementById("chipsNeededDisplay");
var invDisplayEl = document.getElementById("invDisplay");
var statusEl = document.getElementById("status");
var startScreen = document.getElementById("startScreen");
var levelComplete = document.getElementById("levelComplete");
var gameOver = document.getElementById("gameOver");
var winScreen = document.getElementById("winScreen");
var editorBar = document.getElementById("editorBar");
var exportModal = document.getElementById("exportModal");
var importModal = document.getElementById("importModal");
var rateModal = document.getElementById("rateModal");
var pauseMenu = document.getElementById("pauseMenu");
var pauseBtn = document.getElementById("pauseBtn");
var backToEditorBtn = document.getElementById("backToEditorBtn");
var backToEditorWinBtn = document.getElementById("backToEditorWinBtn");

var level = 0;
var chipsCollected = 0, chipsNeeded = 0;
var levelTimeLimit = 0, levelTimeLeft = 0, levelMaxMoves = 0, moveCount = 0;
var levelTitle = "";
var timeDisplayEl = document.getElementById("timeDisplay");
var movesDisplayEl = document.getElementById("movesDisplay");
var levelTitleEl = document.getElementById("levelTitle");
var player = {
  x: 1, y: 1, dir: 0, frame: 0, moving: false, animTimer: 0,
  sliding: false, slideQueue: [], slideTimer: 0,
  fromX: 1, fromY: 1
};
var enemies = [];
var map = [];
var overlay = [];
var blocks = [];
var traps = [];
var cloners = [];
var teleporters = [];
var toggleOpen = true;
var gameState = "start";
var customLevel = null, fromEditor = false;

var inv = { keys: {b:0,r:0,g:0,y:0}, boots: {flip:false, fire:false, ice:false, suction:false} };

var editMap = [], editCols = 32, editRows = 32, selectedTile = "W", painting = false;
/** Item overlay layer (parallel strings; space = empty). Blocks live in editBlocks. */
var editOverlay = [];
/** Block positions in the editor: array of {x,y}. */
var editBlocks = [];
/** Active editor paint layer: "base" | "item" | "block". */
var editLayer = "base";
var touchStartX = 0, touchStartY = 0, touchActive = false;
var SWIPE_THRESHOLD = 24;
/** Editor utilities: brush 1/3/5, tile-viewport zoom (8–100 step 4), pan, favorites 0–9. */
var brushSize = 1;
var editViewSize = 32;
var editCamX = 0;
var editCamY = 0;
var editZoom = 1; // legacy alias; real zoom is editViewSize
var favorites = [null, null, null, null, null, null, null, null, null, null];
var editPanning = false;
var editPanStartX = 0, editPanStartY = 0, editPanCamX = 0, editPanCamY = 0;

/** Refresh chips count and key/boot symbols in the HUD. */
function updateHud() {
  if (chipCountEl) chipCountEl.textContent = String(chipsCollected);
  if (chipsNeededDisplayEl) chipsNeededDisplayEl.textContent = String(chipsNeeded);
  if (timeDisplayEl) {
    if (levelTimeLimit > 0) {
      var sec = Math.max(0, Math.ceil(levelTimeLeft));
      timeDisplayEl.textContent = String(sec);
      timeDisplayEl.parentElement && timeDisplayEl.parentElement.classList.remove("hidden");
    } else {
      timeDisplayEl.textContent = "—";
    }
  }
  if (movesDisplayEl) {
    if (levelMaxMoves > 0) {
      movesDisplayEl.textContent = moveCount + "/" + levelMaxMoves;
    } else {
      movesDisplayEl.textContent = String(moveCount);
    }
  }
  if (levelTitleEl) levelTitleEl.textContent = levelTitle || "";
  if (!invDisplayEl) return;
  var parts = [];
  if (inv.keys.b > 0) parts.push('<span class="inv-icon key-b" title="Blue key">K' + (inv.keys.b > 1 ? '<span class="cnt">' + inv.keys.b + '</span>' : '') + '</span>');
  if (inv.keys.r > 0) parts.push('<span class="inv-icon key-r" title="Red key">K' + (inv.keys.r > 1 ? '<span class="cnt">' + inv.keys.r + '</span>' : '') + '</span>');
  if (inv.keys.g > 0) parts.push('<span class="inv-icon key-g" title="Green key">K' + (inv.keys.g > 1 ? '<span class="cnt">' + inv.keys.g + '</span>' : '') + '</span>');
  if (inv.keys.y > 0) parts.push('<span class="inv-icon key-y" title="Yellow key">K' + (inv.keys.y > 1 ? '<span class="cnt">' + inv.keys.y + '</span>' : '') + '</span>');
  if (inv.boots.flip) parts.push('<span class="inv-icon boot-flip" title="Flippers">F</span>');
  if (inv.boots.fire) parts.push('<span class="inv-icon boot-fire" title="Fire boots">B</span>');
  if (inv.boots.ice) parts.push('<span class="inv-icon boot-ice" title="Ice skates">I</span>');
  if (inv.boots.suction) parts.push('<span class="inv-icon boot-suction" title="Suction boots">S</span>');
  invDisplayEl.innerHTML = parts.join("");
}

function recordPlayerMove() {
  moveCount = (moveCount || 0) + 1;
  if (levelMaxMoves > 0 && moveCount > levelMaxMoves) {
    gameState = "dead";
    if (statusEl) statusEl.textContent = "Out of moves!";
    if (typeof showScreen === "function") showScreen(gameOver);
  }
  if (typeof updateHud === "function") updateHud();
}

function tickLevelClock(dt) {
  if (gameState !== "play") return;
  if (levelTimeLimit <= 0) return;
  levelTimeLeft -= dt;
  if (levelTimeLeft <= 0) {
    levelTimeLeft = 0;
    gameState = "dead";
    if (statusEl) statusEl.textContent = "Time up!";
    if (typeof showScreen === "function") showScreen(gameOver);
  }
  if (typeof updateHud === "function") updateHud();
}

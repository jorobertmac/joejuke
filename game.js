/**
 * Joe's Juke — 5 Level Concept Game
 * Concept built around the wd17d.jpg pixel art sheet (bald blue-shirted hero, tiles, enemies)
 */

(() => {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const TILE = 32;
  const COLS = 20;
  const ROWS = 15;

  const levelNumEl = document.getElementById("levelNum");
  const keyCountEl = document.getElementById("keyCount");
  const statusEl = document.getElementById("status");

  const startScreen = document.getElementById("startScreen");
  const levelComplete = document.getElementById("levelComplete");
  const gameOver = document.getElementById("gameOver");
  const winScreen = document.getElementById("winScreen");

  let level = 0;
  let keysCollected = 0;
  let keysNeeded = 0;
  let player = { x: 1, y: 1, dir: 0, frame: 0, moving: false, animTimer: 0 };
  let enemies = [];
  let map = [];
  let gameState = "start";

  const WALL = 1, FLOOR = 2, WATER = 3, EXIT = 4, KEY = 5, LOCK = 6, SPIKE = 7, ICE = 8;

  const LEVELS = [
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W........P.........W",
      "W..................W",
      "W....WWWW..........W",
      "W..................W",
      "W..........K.......W",
      "W..................W",
      "W....WWWW..........W",
      "W..................W",
      "W..................W",
      "W.............E....W",
      "W..................W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.P................W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W.K....L...........W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W......K...........W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W.............L....W",
      "W.WWWW.WWWW.WWWW.E.W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.P....~.~.~.......W",
      "W.WWWW.WWWW.WWWW...W",
      "W......M...........W",
      "W.K................W",
      "W.WWWW.~.~.WWWW....W",
      "W..................W",
      "W......M.....K.....W",
      "W.WWWW.WWWW.WWWW...W",
      "W..................W",
      "W.............L....W",
      "W.~~~~.WWWW.~~~~.E.W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.P................W",
      "W.IIII.IIII.IIII...W",
      "W......S...........W",
      "W.K....S...........W",
      "W.IIII.IIII.IIII...W",
      "W......S.....M.....W",
      "W......K...........W",
      "W.IIII.IIII.IIII...W",
      "W......S...........W",
      "W.............L....W",
      "W.IIII.IIII.IIII.E.W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ],
    [
      "WWWWWWWWWWWWWWWWWWWW",
      "W.P..~..S..~..S....W",
      "W.WW.WW.WW.WW.WW...W",
      "W....M.....M.......W",
      "W.K..IIIIIIIIII....W",
      "W.WW.WW.WW.WW.WW...W",
      "W......M.....K.....W",
      "W.~~~~.~~~~.~~~~...W",
      "W.WW.WW.WW.WW.WW...W",
      "W....S.....S.......W",
      "W.............L....W",
      "W.IIII.M.IIII.M..E.W",
      "W..................W",
      "W..................W",
      "WWWWWWWWWWWWWWWWWWWW"
    ]
  ];

  function parseLevel(raw) {
    map = [];
    enemies = [];
    keysNeeded = 0;
    keysCollected = 0;
    for (let y = 0; y < ROWS; y++) {
      map[y] = [];
      for (let x = 0; x < COLS; x++) {
        const ch = raw[y][x];
        let t = FLOOR;
        if (ch === "W") t = WALL;
        else if (ch === "~") t = WATER;
        else if (ch === "E") t = EXIT;
        else if (ch === "K") { t = KEY; keysNeeded++; }
        else if (ch === "L") t = LOCK;
        else if (ch === "S") t = SPIKE;
        else if (ch === "I") t = ICE;
        else if (ch === "P") { t = FLOOR; player.x = x; player.y = y; }
        else if (ch === "M") {
          t = FLOOR;
          enemies.push({ x, y, dir: Math.random() < 0.5 ? 1 : -1, axis: Math.random() < 0.5 ? "x" : "y", timer: 0 });
        }
        map[y][x] = t;
      }
    }
  }

  function loadLevel(n) {
    level = n;
    parseLevel(LEVELS[n]);
    player.dir = 0; player.frame = 0; player.moving = false;
    levelNumEl.textContent = n + 1;
    keyCountEl.textContent = keysCollected;
    statusEl.textContent = "Collect keys & reach the exit";
    gameState = "play";
    hideAllScreens();
  }

  function hideAllScreens() {
    [startScreen, levelComplete, gameOver, winScreen].forEach(el => el.classList.add("hidden"));
  }

  function showScreen(el) {
    hideAllScreens();
    el.classList.remove("hidden");
  }

  function canWalk(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    const t = map[y][x];
    if (t === WALL || t === WATER || t === SPIKE) return false;
    if (t === LOCK && keysCollected < keysNeeded) return false;
    return true;
  }

  function tryMove(dx, dy) {
    if (gameState !== "play") return;
    let nx = player.x + dx, ny = player.y + dy;
    if (!canWalk(nx, ny)) return;

    if (map[ny][nx] === ICE) {
      let sx = nx, sy = ny;
      while (true) {
        const tx = sx + dx, ty = sy + dy;
        if (!canWalk(tx, ty) || map[ty][tx] !== ICE) break;
        sx = tx; sy = ty;
      }
      player.x = sx; player.y = sy;
    } else {
      player.x = nx; player.y = ny;
    }

    player.dir = dx > 0 ? 0 : dx < 0 ? 1 : dy > 0 ? 2 : 3;
    player.moving = true;
    player.animTimer = 0;

    if (map[player.y][player.x] === KEY) {
      map[player.y][player.x] = FLOOR;
      keysCollected++;
      keyCountEl.textContent = keysCollected;
      statusEl.textContent = keysCollected >= keysNeeded ? "All keys! Head to exit" : "Key collected!";
    }
    if (map[player.y][player.x] === LOCK && keysCollected >= keysNeeded) {
      map[player.y][player.x] = FLOOR;
      statusEl.textContent = "Lock opened!";
    }
    if (map[player.y][player.x] === EXIT) {
      if (keysCollected >= keysNeeded) {
        if (level >= LEVELS.length - 1) {
          gameState = "win";
          showScreen(winScreen);
        } else {
          gameState = "levelDone";
          showScreen(levelComplete);
        }
      } else statusEl.textContent = "Need more keys!";
    }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      e.timer += dt;
      if (e.timer < 0.4) continue;
      e.timer = 0;
      let nx = e.x, ny = e.y;
      if (e.axis === "x") nx += e.dir; else ny += e.dir;
      if (!canWalk(nx, ny) || map[ny][nx] === EXIT || map[ny][nx] === KEY) {
        e.dir *= -1;
        if (e.axis === "x") nx = e.x + e.dir; else ny = e.y + e.dir;
      }
      if (canWalk(nx, ny)) { e.x = nx; e.y = ny; }
      if (e.x === player.x && e.y === player.y) {
        gameState = "dead";
        showScreen(gameOver);
      }
    }
  }

  function drawJoe(px, py, dir, frame) {
    const bob = player.moving ? Math.sin(frame * 12) * 1.5 : 0;
    ctx.fillStyle = "#2c3e50";
    if (player.moving) {
      ctx.fillRect(px + 8, py + 22 + bob, 6, 8);
      ctx.fillRect(px + 18, py + 22 - bob, 6, 8);
    } else {
      ctx.fillRect(px + 9, py + 22, 6, 8);
      ctx.fillRect(px + 17, py + 22, 6, 8);
    }
    ctx.fillStyle = "#3498db";
    ctx.fillRect(px + 7, py + 10 + bob, 18, 14);
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.arc(px + 16, py + 7 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(px + 12, py + 5 + bob, 2, 2);
    ctx.fillRect(px + 18, py + 5 + bob, 2, 2);
    ctx.fillStyle = "#e74c3c";
    if (dir === 0) ctx.fillRect(px + 22, py + 14 + bob, 4, 2);
    else if (dir === 1) ctx.fillRect(px + 6, py + 14 + bob, 4, 2);
    else if (dir === 2) ctx.fillRect(px + 15, py + 20 + bob, 2, 4);
    else ctx.fillRect(px + 15, py + 4 + bob, 2, 4);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = map[y][x];
        const px = x * TILE, py = y * TILE;
        ctx.fillStyle = "#1e1e2e";
        ctx.fillRect(px, py, TILE, TILE);

        if (t === WALL) {
          ctx.fillStyle = "#3d3d5c";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "#5a5a7a";
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.strokeStyle = "#2a2a3a";
          ctx.beginPath();
          ctx.moveTo(px, py + 16); ctx.lineTo(px + 32, py + 16);
          ctx.stroke();
        } else if (t === WATER) {
          ctx.fillStyle = "#1a5a8a";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = "rgba(100,180,255,0.35)";
          ctx.fillRect(px + 4, py + 8, 8, 4);
          ctx.fillRect(px + 16, py + 18, 10, 3);
        } else if (t === EXIT) {
          ctx.fillStyle = "#27ae60";
          ctx.fillRect(px + 4, py + 4, 24, 24);
          ctx.fillStyle = "#2ecc71";
          ctx.fillRect(px + 8, py + 8, 16, 16);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("E", px + 11, py + 20);
        } else if (t === KEY) {
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.arc(px + 16, py + 13, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(px + 14, py + 17, 4, 8);
          ctx.fillRect(px + 14, py + 23, 8, 3);
        } else if (t === LOCK) {
          ctx.fillStyle = "#c0392b";
          ctx.fillRect(px + 6, py + 6, 20, 20);
          ctx.fillStyle = "#e74c3c";
          ctx.fillRect(px + 10, py + 10, 12, 12);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText("L", px + 11, py + 20);
        } else if (t === SPIKE) {
          ctx.fillStyle = "#8e44ad";
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 4);
          ctx.lineTo(px + 28, py + 28);
          ctx.lineTo(px + 4, py + 28);
          ctx.closePath();
          ctx.fill();
        } else if (t === ICE) {
          ctx.fillStyle = "#a0d8ef";
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.strokeRect(px + 3, py + 3, 26, 26);
        } else if ((x + y) % 2 === 0) {
          ctx.fillStyle = "#252535";
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }

    for (const e of enemies) {
      const px = e.x * TILE, py = e.y * TILE;
      ctx.fillStyle = "#27ae60";
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 18, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px + 11, py + 14, 3.5, 0, Math.PI * 2);
      ctx.arc(px + 21, py + 14, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(px + 11, py + 14, 1.5, 0, Math.PI * 2);
      ctx.arc(px + 21, py + 14, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawJoe(player.x * TILE, player.y * TILE, player.dir, player.animTimer);
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (gameState === "play") {
      updateEnemies(dt);
      if (player.moving) {
        player.animTimer += dt;
        if (player.animTimer > 0.35) player.moving = false;
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", e => {
    if (gameState !== "play") return;
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") tryMove(0, -1);
    else if (k === "arrowdown" || k === "s") tryMove(0, 1);
    else if (k === "arrowleft" || k === "a") tryMove(-1, 0);
    else if (k === "arrowright" || k === "d") tryMove(1, 0);
    e.preventDefault();
  });

  document.getElementById("startBtn").addEventListener("click", () => loadLevel(0));
  document.getElementById("nextBtn").addEventListener("click", () => loadLevel(level + 1));
  document.getElementById("retryBtn").addEventListener("click", () => loadLevel(level));
  document.getElementById("restartBtn").addEventListener("click", () => loadLevel(0));

  requestAnimationFrame(loop);
})();

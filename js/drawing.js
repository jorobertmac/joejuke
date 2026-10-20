/**
 * Joe's Juke — asset loading & rendering
 */
"use strict";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load " + src));
    img.src = src;
  });
}

async function loadAssets() {
  try {
    const base = "resources/";
    const [terrain, items, joe, block, ...mons] = await Promise.all([
      loadImage(base + "tiles/terrain.png"),
      loadImage(base + "tiles/items.png"),
      loadImage(base + "sprites/joe.png"),
      loadImage(base + "tiles/item_block.png"),
      ...MONSTER_TYPES.map(t => loadImage(base + "monsters/" + t + ".png")),
    ]);
    assets.terrain = terrain;
    assets.items = items;
    assets.joe = joe;
    assets.block = block;
    MONSTER_TYPES.forEach((t, i) => { assets.monsters[t] = mons[i]; });
    assets.ready = true;
    console.log("Joe's Juke assets loaded");
  } catch (err) {
    console.warn("Asset load failed, using procedural fallback:", err);
    assets.ready = false;
  }
}

function drawSheetFrame(img, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!img) return false;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw || sw, dh || sh);
  return true;
}

function drawTerrainSprite(t, px, py) {
  if (!assets.ready || !assets.terrain) return false;
  if (t === 0) {
    const checker = ((px / TILE) + (py / TILE)) % 2 === 0;
    const idx = checker ? 0 : 1;
    return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
  }
  if (t === 32) {
    const tr = traps.find(tr => tr.x === px / TILE && tr.y === py / TILE);
    const idx = (tr && tr.open) ? 33 : 32;
    drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py);
    return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
  }
  if (t === 33) {
    const idx = toggleOpen ? 35 : 34;
    return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
  }
  if (t === 34) {
    const idx = toggleOpen ? 34 : 35;
    return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
  }
  if (ITEM_IDX[t] !== undefined) {
    drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py);
    return drawSheetFrame(assets.items, ITEM_IDX[t] * TILE, 0, TILE, TILE, px, py);
  }
  const idx = TERRAIN_IDX[t];
  if (idx === undefined) return false;
  if (t === 20 || t === 21 || (t >= 25 && t <= 28)) {
    drawSheetFrame(assets.terrain, 0 * TILE, 0, TILE, TILE, px, py);
    if (t === 20 || t === 21) return true;
  }
  return drawSheetFrame(assets.terrain, idx * TILE, 0, TILE, TILE, px, py);
}

function drawItemSprite(ov, px, py) {
  if (!assets.ready || !assets.items || ov == null) return false;
  const idx = ITEM_IDX[ov];
  if (idx === undefined) return false;
  return drawSheetFrame(assets.items, idx * TILE, 0, TILE, TILE, px, py);
}

function drawJoeSprite(px, py, dir, frame) {
  if (!assets.ready || !assets.joe) return false;
  const col = (player.moving || frame > 0.05) ? 1 : 0;
  const row = dir & 3;
  return drawSheetFrame(assets.joe, col * TILE, row * TILE, TILE, TILE, px, py);
}

function drawMonsterSprite(e, px, py) {
  if (!assets.ready) return false;
  const img = assets.monsters[e.type];
  if (!img) return false;
  const row = e.dir & 3;
  let col = 0;
  if (e.type === "blob") {
    col = (Math.floor((performance.now() / 200) % 2));
  }
  const fw = TILE;
  return drawSheetFrame(img, col * fw, row * TILE, fw, TILE, px, py);
}

function drawBlockSprite(px, py) {
  if (!assets.ready || !assets.block) return false;
  return drawSheetFrame(assets.block, 0, 0, TILE, TILE, px, py);
}

function drawJoe(px, py, dir, frame) {
  if (drawJoeSprite(px, py, dir, frame)) return;
  const bob = player.moving ? Math.sin(frame * 12) * 1.5 : 0;
  ctx.fillStyle = "#1a252f";
  if (player.moving) {
    ctx.fillRect(px + 8, py + 22 + bob, 6, 8);
    ctx.fillRect(px + 18, py + 22 - bob, 6, 8);
  } else {
    ctx.fillRect(px + 9, py + 22, 6, 8);
    ctx.fillRect(px + 17, py + 22, 6, 8);
  }
  ctx.fillStyle = "#3498db";
  ctx.fillRect(px + 7, py + 10 + bob, 18, 14);
  ctx.fillStyle = "#2980b9";
  ctx.fillRect(px + 7, py + 10 + bob, 18, 3);
  ctx.fillStyle = "#f5cba7";
  ctx.beginPath(); ctx.arc(px + 16, py + 7 + bob, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(px + 12, py + 5 + bob, 2, 2);
  ctx.fillRect(px + 18, py + 5 + bob, 2, 2);
  ctx.fillStyle = "#e74c3c";
  if (dir === 0) ctx.fillRect(px + 22, py + 14 + bob, 4, 2);
  else if (dir === 1) ctx.fillRect(px + 6, py + 14 + bob, 4, 2);
  else if (dir === 2) ctx.fillRect(px + 15, py + 20 + bob, 2, 4);
  else ctx.fillRect(px + 15, py + 4 + bob, 2, 4);
}

function drawBlock(px, py) {
  if (drawBlockSprite(px, py)) return;
  ctx.fillStyle = "#6B4226";
  ctx.fillRect(px + 2, py + 2, 28, 28);
  ctx.fillStyle = "#A0522D";
  ctx.fillRect(px + 4, py + 4, 24, 24);
  ctx.strokeStyle = "#3E2723";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, 24, 24);
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 16); ctx.lineTo(px + 28, py + 16);
  ctx.moveTo(px + 16, py + 4); ctx.lineTo(px + 16, py + 28);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(255,220,150,0.25)";
  ctx.fillRect(px + 6, py + 6, 10, 6);
}

function drawTerrain(t, px, py) {
  if (drawTerrainSprite(t, px, py)) return;

  const checker = ((px / TILE) + (py / TILE)) % 2 === 0;
  ctx.fillStyle = checker ? "#252535" : "#1e1e2e";
  ctx.fillRect(px, py, TILE, TILE);

  if (t === T.WALL) {
    ctx.fillStyle = "#3d3d5c"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  } else if (t === T.WATER) {
    ctx.fillStyle = "#1a5a8a"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(100,180,255,0.35)";
    ctx.fillRect(px + 4, py + 8, 8, 4); ctx.fillRect(px + 16, py + 18, 10, 3);
  } else if (t === T.FIRE) {
    ctx.fillStyle = "#c0392b"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 24); ctx.lineTo(px + 12, py + 10);
    ctx.lineTo(px + 16, py + 18); ctx.lineTo(px + 20, py + 8);
    ctx.lineTo(px + 24, py + 24); ctx.closePath(); ctx.fill();
  } else if (t === T.ICE || t === T.ICE_NW || t === T.ICE_NE || t === T.ICE_SW || t === T.ICE_SE) {
    ctx.fillStyle = "#a0d8ef"; ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.strokeRect(px + 3, py + 3, 26, 26);
    ctx.fillStyle = "#3d3d5c";
    if (t === T.ICE_NW) { ctx.fillRect(px, py, TILE, 4); ctx.fillRect(px, py, 4, TILE); }
    if (t === T.ICE_NE) { ctx.fillRect(px, py, TILE, 4); ctx.fillRect(px + 28, py, 4, TILE); }
    if (t === T.ICE_SW) { ctx.fillRect(px, py + 28, TILE, 4); ctx.fillRect(px, py, 4, TILE); }
    if (t === T.ICE_SE) { ctx.fillRect(px, py + 28, TILE, 4); ctx.fillRect(px + 28, py, 4, TILE); }
  } else if (isForce(t)) {
    const rnd = t === T.FORCE_R;
    ctx.fillStyle = rnd ? "#1a4a3a" : "#2d5a27";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = rnd ? "#a0ffd0" : "#7dffc4";
    const cx = px + 16, cy = py + 16;
    if (rnd) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy - 4);
      ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx + 4, cy - 4);
      ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx - 4, cy + 4);
      ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx - 4, cy - 4);
      ctx.fill();
    } else {
      const d = forceDirOf(t);
      ctx.beginPath();
      if (d === DIR.N) { ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 8, cy + 4); ctx.lineTo(cx - 8, cy + 4); }
      else if (d === DIR.E) { ctx.moveTo(cx + 10, cy); ctx.lineTo(cx - 4, cy + 8); ctx.lineTo(cx - 4, cy - 8); }
      else if (d === DIR.S) { ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 8, cy - 4); ctx.lineTo(cx - 8, cy - 4); }
      else { ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 4, cy + 8); ctx.lineTo(cx + 4, cy - 8); }
      ctx.closePath(); ctx.fill();
    }
  } else if (t === T.DIRT) {
    ctx.fillStyle = "#6B4226"; ctx.fillRect(px, py, TILE, TILE);
  } else if (t === T.GRAVEL) {
    ctx.fillStyle = "#7f8c8d"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#95a5a6";
    for (let i = 0; i < 6; i++) ctx.fillRect(px + 4 + (i % 3) * 8, py + 6 + Math.floor(i / 3) * 12, 3, 3);
  } else if (t === T.EXIT) {
    ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 4, py + 4, 24, 24);
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.fillText("E", px + 11, py + 20);
  } else if (t === T.SOCKET) {
    ctx.fillStyle = "#34495e"; ctx.fillRect(px + 4, py + 4, 24, 24);
    ctx.fillStyle = "#ecf0f1"; ctx.font = "bold 11px sans-serif"; ctx.fillText("X", px + 11, py + 20);
  } else if (t === T.HINT) {
    ctx.fillStyle = "#f39c12"; ctx.fillRect(px + 6, py + 6, 20, 20);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("?", px + 11, py + 22);
  } else if (t === T.INVIS || t === T.HIDDEN) {
  } else if (t === T.RECESSED) {
    ctx.fillStyle = "#4a4a6a"; ctx.fillRect(px + 4, py + 4, 24, 24);
  } else if (t === T.BLUE_REAL || t === T.BLUE_FAKE) {
    ctx.fillStyle = "#2980b9"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#3498db"; ctx.fillRect(px + 2, py + 2, 28, 28);
  } else if (t === T.THIN_N) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py, TILE, 4); }
  else if (t === T.THIN_S) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py + 28, TILE, 4); }
  else if (t === T.THIN_E) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px + 28, py, 4, TILE); }
  else if (t === T.THIN_W) { ctx.fillStyle = "#5a5a7a"; ctx.fillRect(px, py, 4, TILE); }
  else if (t === T.TELEPORT) {
    ctx.fillStyle = "#8e44ad"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d2b4de"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 6, 0, Math.PI * 2); ctx.fill();
  } else if (t === T.BOMB) {
    ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.arc(px + 16, py + 18, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(px + 14, py + 6, 4, 6);
  } else if (t === T.THIEF) {
    ctx.fillStyle = "#7f8c8d"; ctx.fillRect(px + 8, py + 8, 16, 16);
    ctx.fillStyle = "#e74c3c"; ctx.font = "bold 10px sans-serif"; ctx.fillText("$", px + 11, py + 20);
  } else if (t === T.TRAP) {
    const tr = traps.find(tr => tr.x === px / TILE && tr.y === py / TILE);
    ctx.fillStyle = tr && tr.open ? "#27ae60" : "#c0392b";
    ctx.fillRect(px + 6, py + 6, 20, 20);
  } else if (t === T.TOGGLE_WALL) {
    ctx.fillStyle = toggleOpen ? "#1e1e2e" : "#3d3d5c";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = "#4ecca3"; ctx.strokeRect(px + 2, py + 2, 28, 28);
  } else if (t === T.TOGGLE_FLOOR) {
    ctx.fillStyle = toggleOpen ? "#3d3d5c" : "#1e1e2e";
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = "#4ecca3"; ctx.strokeRect(px + 2, py + 2, 28, 28);
  } else if (t === T.CLONER) {
    ctx.fillStyle = "#16a085"; ctx.fillRect(px + 4, py + 4, 24, 24);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("+", px + 11, py + 22);
  } else if (t === T.BTN_GREEN) {
    ctx.fillStyle = "#27ae60"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
  } else if (t === T.BTN_RED) {
    ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
  } else if (t === T.BTN_BLUE) {
    ctx.fillStyle = "#3498db"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
  } else if (t === T.BTN_BROWN) {
    ctx.fillStyle = "#a0522d"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
  } else if (t === T.LOCK_B) {
    ctx.fillStyle = "#2980b9"; ctx.fillRect(px + 6, py + 6, 20, 20);
  } else if (t === T.LOCK_R) {
    ctx.fillStyle = "#c0392b"; ctx.fillRect(px + 6, py + 6, 20, 20);
  } else if (t === T.LOCK_G) {
    ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 6, py + 6, 20, 20);
  } else if (t === T.LOCK_Y) {
    ctx.fillStyle = "#f1c40f"; ctx.fillRect(px + 6, py + 6, 20, 20);
  }
}

function drawOverlayItem(ov, px, py) {
  if (!ov) return;
  if (drawItemSprite(ov, px, py)) return;
  if (ov === T.CHIP) {
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(px + 8, py + 6, 16, 20);
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(px + 10, py + 8, 12, 16);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("C", px + 12, py + 20);
  } else if (ov === T.KEY_B || ov === T.KEY_R || ov === T.KEY_G || ov === T.KEY_Y) {
    const col = ov === T.KEY_B ? "#3498db" : ov === T.KEY_R ? "#e74c3c" : ov === T.KEY_G ? "#2ecc71" : "#f1c40f";
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(px + 16, py + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(px + 14, py + 16, 4, 9);
    ctx.fillRect(px + 14, py + 22, 8, 3);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.arc(px + 14, py + 10, 2, 0, Math.PI * 2); ctx.fill();
  } else if (ov === T.BOOT_FLIP || ov === T.BOOT_FIRE || ov === T.BOOT_ICE || ov === T.BOOT_SUCTION) {
    const col = ov === T.BOOT_FLIP ? "#3498db" : ov === T.BOOT_FIRE ? "#e67e22" : ov === T.BOOT_ICE ? "#85c1e9" : "#2ecc71";
    ctx.fillStyle = col;
    ctx.fillRect(px + 7, py + 12, 18, 14);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(px + 7, py + 20, 18, 6);
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(px + 6, py + 24, 20, 3);
  }
}

function drawEnemy(e, px, py) {
  if (drawMonsterSprite(e, px, py)) return;
  const type = e.type;
  const cx = px + 16, cy = py + 16;
  if (type === "ball") {
    ctx.fillStyle = "#ff69b4";
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
  } else if (type === "glider") {
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.moveTo(cx, py + 3); ctx.lineTo(px + 29, cy);
    ctx.lineTo(cx, py + 29); ctx.lineTo(px + 3, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#85c1e9";
    ctx.beginPath();
    ctx.moveTo(cx, py + 8); ctx.lineTo(px + 24, cy);
    ctx.lineTo(cx, py + 24); ctx.lineTo(px + 8, cy);
    ctx.closePath(); ctx.fill();
  } else if (type === "fireball") {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e67e22";
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  } else if (type === "bug") {
    ctx.fillStyle = "#f4d03f";
    ctx.beginPath(); ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b7950b";
    ctx.fillRect(px + 4, cy - 1, 4, 2);
    ctx.fillRect(px + 24, cy - 1, 4, 2);
  } else if (type === "paramecium") {
    ctx.fillStyle = "#1abc9c";
    const rot = (e.dir % 2 === 0) ? Math.PI / 2 : 0;
    ctx.beginPath(); ctx.ellipse(cx, cy, 14, 7, rot, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0e6655";
    ctx.beginPath(); ctx.ellipse(cx, cy, 8, 3, rot, 0, Math.PI * 2); ctx.fill();
  } else if (type === "tank") {
    ctx.fillStyle = "#16a085";
    ctx.fillRect(px + 3, py + 7, 26, 18);
    ctx.fillStyle = "#0e6655";
    ctx.fillRect(px + 5, py + 9, 22, 14);
    ctx.fillStyle = "#1a5276";
    if (e.dir === DIR.E) ctx.fillRect(px + 22, py + 13, 10, 6);
    else if (e.dir === DIR.W) ctx.fillRect(px + 0, py + 13, 10, 6);
    else if (e.dir === DIR.N) ctx.fillRect(px + 13, py + 0, 6, 10);
    else ctx.fillRect(px + 13, py + 22, 6, 10);
  } else if (type === "walker") {
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(px + 8, py + 5, 16, 18);
    ctx.fillStyle = "#5b2c6f";
    ctx.fillRect(px + 10, py + 20, 5, 7);
    ctx.fillRect(px + 17, py + 20, 5, 7);
    ctx.fillStyle = "#d7bde2";
    ctx.fillRect(px + 11, py + 8, 4, 4);
    ctx.fillRect(px + 17, py + 8, 4, 4);
  } else if (type === "teeth") {
    ctx.fillStyle = "#27ae60";
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(px + 9, py + 22, 3, 5);
    ctx.fillRect(px + 14, py + 23, 3, 5);
    ctx.fillRect(px + 19, py + 22, 3, 5);
    ctx.fillStyle = "#1e8449";
    ctx.fillRect(px + 10, py + 10, 3, 3);
    ctx.fillRect(px + 19, py + 10, 3, 3);
  } else if (type === "blob") {
    ctx.fillStyle = "#58d68d";
    ctx.beginPath(); ctx.ellipse(cx, cy, 13, 11, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.ellipse(cx - 3, cy - 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawMapTiles(useEdit) {
  const rows = useEdit ? editRows : ROWS;
  const cols = useEdit ? editCols : COLS;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * TILE, py = y * TILE;
      if (useEdit) {
        const ch = (editMap[y] && editMap[y][x]) || ".";
        if (CH[ch] !== undefined) drawTerrain(CH[ch], px, py);
        else if (MONSTER_CHARS[ch]) {
          drawTerrain(T.FLOOR, px, py);
          drawEnemy({ type: MONSTER_CHARS[ch].type, dir: MONSTER_CHARS[ch].dir }, px, py);
        } else if (ch === "A") {
          drawTerrain(T.FLOOR, px, py);
          drawJoe(px, py, 0, 0);
        } else drawTerrain(T.FLOOR, px, py);
      } else {
        drawTerrain(map[y][x], px, py);
        drawOverlayItem(overlay[y][x], px, py);
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === "editor") {
    if (!editMap.length) { ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
    drawMapTiles(true); return;
  }
  if (!map.length) { ctx.fillStyle = "#0f0f1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
  drawMapTiles(false);
  for (const b of blocks) drawBlock(b.x * TILE, b.y * TILE);
  for (const e of enemies) drawEnemy(e, e.x * TILE, e.y * TILE);
  drawJoe(player.x * TILE, player.y * TILE, player.dir, player.animTimer);
}

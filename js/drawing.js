/**
 * Joe's Juke — asset loading & rendering
 * Composite: base terrain → item overlay → blocks → actors
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
  if (e.type === "blob") col = (Math.floor((performance.now() / 200) % 2));
  return drawSheetFrame(img, col * TILE, row * TILE, TILE, TILE, px, py);
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
  ctx.fillStyle = "#3498db"; ctx.fillRect(px + 7, py + 10 + bob, 18, 14);
  ctx.fillStyle = "#2980b9"; ctx.fillRect(px + 7, py + 10 + bob, 18, 3);
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
  ctx.fillStyle = "#6B4226"; ctx.fillRect(px + 2, py + 2, 28, 28);
  ctx.fillStyle = "#A0522D"; ctx.fillRect(px + 4, py + 4, 24, 24);
  ctx.strokeStyle = "#3E2723"; ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, 24, 24);
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 16); ctx.lineTo(px + 28, py + 16);
  ctx.moveTo(px + 16, py + 4); ctx.lineTo(px + 16, py + 28);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(255,220,150,0.25)"; ctx.fillRect(px + 6, py + 6, 10, 6);
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
  } else if (t === T.FIRE) {
    ctx.fillStyle = "#c0392b"; ctx.fillRect(px, py, TILE, TILE);
  } else if (t === T.ICE || t === T.ICE_NW || t === T.ICE_NE || t === T.ICE_SW || t === T.ICE_SE) {
    ctx.fillStyle = "#a0d8ef"; ctx.fillRect(px, py, TILE, TILE);
  } else if (typeof isForce === "function" && isForce(t)) {
    ctx.fillStyle = t === T.FORCE_R ? "#1a4a3a" : "#2d5a27";
    ctx.fillRect(px, py, TILE, TILE);
  } else if (t === T.EXIT) {
    ctx.fillStyle = "#27ae60"; ctx.fillRect(px + 4, py + 4, 24, 24);
  } else if (t === T.SOCKET) {
    ctx.fillStyle = "#34495e"; ctx.fillRect(px + 4, py + 4, 24, 24);
  }
}

function drawOverlayItem(ov, px, py) {
  if (!ov) return;
  if (drawItemSprite(ov, px, py)) return;
}

function drawEnemy(e, px, py) {
  if (drawMonsterSprite(e, px, py)) return;
}

function drawMapTiles(useEdit, camX, camY) {
  if (useEdit) {
    var vs = (typeof editViewSize === "number" && editViewSize > 0) ? editViewSize : 32;
    var ox = (typeof editCamX === "number") ? editCamX : 0;
    var oy = (typeof editCamY === "number") ? editCamY : 0;
    if (typeof ensureEditOverlay === "function") ensureEditOverlay();
    for (let vy = 0; vy < vs; vy++) {
      for (let vx = 0; vx < vs; vx++) {
        const x = ox + vx, y = oy + vy;
        const px = vx * TILE, py = vy * TILE;
        if (y < 0 || y >= editRows || x < 0 || x >= editCols || !editMap[y]) {
          ctx.fillStyle = "#0a0a14";
          ctx.fillRect(px, py, TILE, TILE);
          continue;
        }
        const ch = editMap[y][x] || ".";
        if (CH[ch] !== undefined) {
          const id = CH[ch];
          if ((id >= T.KEY_B && id <= T.KEY_Y) || (id >= T.BOOT_FLIP && id <= T.BOOT_SUCTION) || id === T.CHIP || id === T.BLOCK) {
            drawTerrain(T.FLOOR, px, py);
          } else {
            drawTerrain(id, px, py);
          }
        } else if (MONSTER_CHARS[ch]) {
          drawTerrain(T.FLOOR, px, py);
        } else if (ch === "A") {
          drawTerrain(T.FLOOR, px, py);
        } else {
          drawTerrain(T.FLOOR, px, py);
        }
        var och = (typeof getOverlayChar === "function") ? getOverlayChar(x, y) : " ";
        if (och && och !== " " && CH[och] !== undefined) {
          drawOverlayItem(CH[och], px, py);
        } else if (CH[ch] !== undefined) {
          const id2 = CH[ch];
          if ((id2 >= T.KEY_B && id2 <= T.KEY_Y) || (id2 >= T.BOOT_FLIP && id2 <= T.BOOT_SUCTION) || id2 === T.CHIP) {
            drawOverlayItem(id2, px, py);
          }
        }
        var hasBlk = (typeof hasEditBlock === "function") ? hasEditBlock(x, y) : false;
        if (hasBlk || ch === "B") drawBlock(px, py);
        if (MONSTER_CHARS[ch]) {
          drawEnemy({ type: MONSTER_CHARS[ch].type, dir: MONSTER_CHARS[ch].dir }, px, py);
        } else if (ch === "A") {
          drawJoe(px, py, 0, 0);
        }
      }
    }
    return;
  }
  if (camX == null || isNaN(camX)) camX = 0;
  if (camY == null || isNaN(camY)) camY = 0;
  var vc = (typeof VIEW_COLS === "number") ? VIEW_COLS : 9;
  var vr = (typeof VIEW_ROWS === "number") ? VIEW_ROWS : 9;
  for (let vy = 0; vy < vr; vy++) {
    for (let vx = 0; vx < vc; vx++) {
      const x = camX + vx, y = camY + vy;
      const px = vx * TILE, py = vy * TILE;
      if (y < 0 || y >= ROWS || x < 0 || x >= COLS || !map[y]) {
        ctx.fillStyle = "#0f0f1a";
        ctx.fillRect(px, py, TILE, TILE);
        continue;
      }
      drawTerrain(map[y][x], px, py);
      drawOverlayItem(overlay[y][x], px, py);
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
  const cam = (typeof getCamera === "function") ? getCamera() : { camX: 0, camY: 0 };
  drawMapTiles(false, cam.camX, cam.camY);
  for (const b of blocks) {
    const sx = b.x - cam.camX, sy = b.y - cam.camY;
    if (sx < -1 || sy < -1 || sx > VIEW_COLS || sy > VIEW_ROWS) continue;
    drawBlock(sx * TILE, sy * TILE);
  }
  for (const e of enemies) {
    const sx = e.x - cam.camX, sy = e.y - cam.camY;
    if (sx < -1 || sy < -1 || sx > VIEW_COLS || sy > VIEW_ROWS) continue;
    drawEnemy(e, sx * TILE, sy * TILE);
  }
  const pos = (typeof playerDrawPos === "function")
    ? playerDrawPos()
    : { px: player.x * TILE, py: player.y * TILE };
  drawJoe(pos.px - cam.camX * TILE, pos.py - cam.camY * TILE, player.dir, player.animTimer);
}

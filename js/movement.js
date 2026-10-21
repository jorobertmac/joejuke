/**
 * Joe's Juke — player & monster movement
 */
"use strict";

function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }

function blockAt(x, y) {
  return blocks.find(b => b.x === x && b.y === y);
}

function isClosedTrap(x, y) {
  if (map[y][x] !== T.TRAP) return false;
  const tr = traps.find(tr => tr.x === x && tr.y === y);
  return tr && !tr.open;
}

function solidToPlayer(x, y, fromDir) {
  if (!inBounds(x, y)) return true;
  if (blockAt(x, y)) return true;
  const t = map[y][x];
  if (t === T.WALL || t === T.INVIS) return true;
  if (t === T.HIDDEN) { map[y][x] = T.WALL; return true; }
  if (t === T.BLUE_REAL) { map[y][x] = T.WALL; return true; }
  if (t === T.BLUE_FAKE) { map[y][x] = T.FLOOR; return false; }
  if (t === T.RECESSED) return false;
  if (t === T.TOGGLE_WALL && !toggleOpen) return true;
  if (t === T.TOGGLE_FLOOR && toggleOpen) return true;
  if (t === T.LOCK_B && inv.keys.b <= 0) return true;
  if (t === T.LOCK_R && inv.keys.r <= 0) return true;
  if (t === T.LOCK_G && inv.keys.g <= 0) return true;
  if (t === T.LOCK_Y && inv.keys.y <= 0) return true;
  if (t === T.THIN_N && fromDir === DIR.S) return true;
  if (t === T.THIN_S && fromDir === DIR.N) return true;
  if (t === T.THIN_E && fromDir === DIR.W) return true;
  if (t === T.THIN_W && fromDir === DIR.E) return true;
  if (isIce(t) && t !== T.ICE && !canEnterIceCorner(t, fromDir)) return true;
  if (t === T.SOCKET && chipsCollected < chipsNeeded) return true;
  return false;
}

function solidToMonster(e, x, y) {
  if (!inBounds(x, y)) return true;
  if (blockAt(x, y)) return true;
  const t = map[y][x];
  if (t === T.WALL || t === T.INVIS || t === T.HIDDEN || t === T.BLUE_REAL) return true;
  if (t === T.DIRT || t === T.GRAVEL) return true;
  if (t === T.RECESSED) return true;
  if (t === T.TOGGLE_WALL && !toggleOpen) return true;
  if (t === T.TOGGLE_FLOOR && toggleOpen) return true;
  if (t === T.SOCKET || t === T.EXIT || t === T.LOCK_B || t === T.LOCK_R || t === T.LOCK_G || t === T.LOCK_Y) return true;
  if (isIce(t) && t !== T.ICE && !canEnterIceCorner(t, e.dir)) return true;
  return false;
}

function slidePath(sx, sy, dir, isBlock, monster) {
  let x = sx, y = sy, d = dir;
  let steps = 0;
  while (steps++ < COLS * ROWS + 4) {
    const tHere = map[y][x];
    if (isIce(tHere) && tHere !== T.ICE) d = iceRedirect(tHere, d);
    if (isForce(tHere)) {
      if (isBlock || !inv.boots.suction) d = forceDirOf(tHere);
    }
    const nx = x + DX[d], ny = y + DY[d];
    if (isBlock) {
      if (!inBounds(nx, ny) || blockAt(nx, ny)) break;
      const nt = map[ny][nx];
      if (nt === T.WALL || nt === T.INVIS) break;
      x = nx; y = ny;
      if (nt === T.WATER) break;
      if (!isSlide(nt)) break;
    } else if (monster) {
      if (solidToMonster(monster, nx, ny)) break;
      const nt = map[ny][nx];
      x = nx; y = ny;
      if (nt === T.WATER && monster.type !== "glider") break;
      if (nt === T.FIRE && monster.type !== "fireball") break;
      if (nt === T.BOMB) break;
      if (!isSlide(nt)) break;
    } else {
      if (solidToPlayer(nx, ny, d)) break;
      const nt = map[ny][nx];
      if (isIce(nt) && inv.boots.ice) { x = nx; y = ny; break; }
      if (isForce(nt) && inv.boots.suction) { x = nx; y = ny; break; }
      x = nx; y = ny;
      if (!isSlide(nt)) break;
    }
  }
  return { x, y, dir: d };
}

function tryMove(dx, dy) {
  if (gameState !== "play") return;
  if (isClosedTrap(player.x, player.y)) {
    statusEl.textContent = "Trapped!";
    return;
  }
  let dir = dx > 0 ? DIR.E : dx < 0 ? DIR.W : dy > 0 ? DIR.S : DIR.N;
  const nx = player.x + dx, ny = player.y + dy;
  if (!inBounds(nx, ny)) return;

  const blk = blockAt(nx, ny);
  if (blk) {
    const bx = nx + dx, by = ny + dy;
    if (!inBounds(bx, by) || blockAt(bx, by) || solidToPlayer(bx, by, dir)) {
      statusEl.textContent = "Can't push!";
      return;
    }
    blk.x = bx; blk.y = by;
    const destT = map[by][bx];
    if (destT === T.WATER) {
      blocks = blocks.filter(b => b !== blk);
      map[by][bx] = T.DIRT;
      statusEl.textContent = "Block filled water!";
    } else if (destT === T.BOMB) {
      blocks = blocks.filter(b => b !== blk);
      map[by][bx] = T.FLOOR;
      statusEl.textContent = "Bomb!";
    } else if (isSlide(destT)) {
      const fin = slidePath(bx, by, dir, true, null);
      blk.x = fin.x; blk.y = fin.y;
      if (map[fin.y][fin.x] === T.WATER) {
        blocks = blocks.filter(b => b !== blk);
        map[fin.y][fin.x] = T.DIRT;
        statusEl.textContent = "Block slid into water!";
      } else if (map[fin.y][fin.x] === T.BOMB) {
        blocks = blocks.filter(b => b !== blk);
        map[fin.y][fin.x] = T.FLOOR;
        statusEl.textContent = "Bomb!";
      }
    }
    player.x = nx; player.y = ny;
  } else if (!solidToPlayer(nx, ny, dir)) {
    const target = map[ny][nx];
    if (isSlide(target) && !(isIce(target) && inv.boots.ice) && !(isForce(target) && inv.boots.suction)) {
      const fin = slidePath(nx, ny, dir, false, null);
      player.x = fin.x; player.y = fin.y; dir = fin.dir;
      statusEl.textContent = isForce(target) ? "Force!" : "Slide!";
    } else {
      player.x = nx; player.y = ny;
    }
  } else return;

  player.dir = dir === DIR.E ? 0 : dir === DIR.W ? 1 : dir === DIR.S ? 2 : 3;
  player.moving = true; player.animTimer = 0;

  const lx = player.x, ly = player.y;
  const land = map[ly][lx];
  const ov = overlay[ly][lx];

  if (land === T.RECESSED) map[ly][lx] = T.WALL;
  if (land === T.DIRT) map[ly][lx] = T.FLOOR;

  var invChanged = false;
  if (ov === T.CHIP) {
    overlay[ly][lx] = null; chipsCollected++;
    statusEl.textContent = "Chip!";
    invChanged = true;
  } else if (ov === T.KEY_B) { overlay[ly][lx] = null; inv.keys.b++; statusEl.textContent = "Blue key!"; invChanged = true; }
  else if (ov === T.KEY_R) { overlay[ly][lx] = null; inv.keys.r++; statusEl.textContent = "Red key!"; invChanged = true; }
  else if (ov === T.KEY_G) { overlay[ly][lx] = null; inv.keys.g++; statusEl.textContent = "Green key!"; invChanged = true; }
  else if (ov === T.KEY_Y) { overlay[ly][lx] = null; inv.keys.y++; statusEl.textContent = "Yellow key!"; invChanged = true; }
  else if (ov === T.BOOT_FLIP) { overlay[ly][lx] = null; inv.boots.flip = true; statusEl.textContent = "Flippers!"; invChanged = true; }
  else if (ov === T.BOOT_FIRE) { overlay[ly][lx] = null; inv.boots.fire = true; statusEl.textContent = "Fire boots!"; invChanged = true; }
  else if (ov === T.BOOT_ICE) { overlay[ly][lx] = null; inv.boots.ice = true; statusEl.textContent = "Ice skates!"; invChanged = true; }
  else if (ov === T.BOOT_SUCTION) { overlay[ly][lx] = null; inv.boots.suction = true; statusEl.textContent = "Suction boots!"; invChanged = true; }

  if (land === T.KEY_B) { map[ly][lx] = T.FLOOR; inv.keys.b++; invChanged = true; }
  if (land === T.KEY_R) { map[ly][lx] = T.FLOOR; inv.keys.r++; invChanged = true; }
  if (land === T.KEY_G) { map[ly][lx] = T.FLOOR; inv.keys.g++; invChanged = true; }
  if (land === T.KEY_Y) { map[ly][lx] = T.FLOOR; inv.keys.y++; invChanged = true; }
  if (land === T.BOOT_FLIP) { map[ly][lx] = T.FLOOR; inv.boots.flip = true; invChanged = true; }
  if (land === T.BOOT_FIRE) { map[ly][lx] = T.FLOOR; inv.boots.fire = true; invChanged = true; }
  if (land === T.BOOT_ICE) { map[ly][lx] = T.FLOOR; inv.boots.ice = true; invChanged = true; }
  if (land === T.BOOT_SUCTION) { map[ly][lx] = T.FLOOR; inv.boots.suction = true; invChanged = true; }

  if (land === T.LOCK_B && inv.keys.b > 0) { map[ly][lx] = T.FLOOR; inv.keys.b--; statusEl.textContent = "Blue lock!"; invChanged = true; }
  if (land === T.LOCK_R && inv.keys.r > 0) { map[ly][lx] = T.FLOOR; inv.keys.r--; statusEl.textContent = "Red lock!"; invChanged = true; }
  if (land === T.LOCK_G && inv.keys.g > 0) { map[ly][lx] = T.FLOOR; inv.keys.g--; statusEl.textContent = "Green lock!"; invChanged = true; }
  if (land === T.LOCK_Y && inv.keys.y > 0) { map[ly][lx] = T.FLOOR; inv.keys.y--; statusEl.textContent = "Yellow lock!"; invChanged = true; }

  if (land === T.SOCKET && chipsCollected >= chipsNeeded) {
    map[ly][lx] = T.FLOOR; statusEl.textContent = "Socket open!";
  }

  if (land === T.THIEF) {
    inv.boots = { flip:false, fire:false, ice:false, suction:false };
    statusEl.textContent = "Thief stole boots!";
    invChanged = true;
  }

  if (invChanged) updateHud();

  if (land === T.HINT) {
    statusEl.textContent = "Hint: collect chips, avoid monsters, use boots!";
  }

  if (land === T.BOMB) {
    gameState = "dead"; showScreen(gameOver); return;
  }

  if (land === T.BTN_GREEN) {
    toggleOpen = !toggleOpen;
    statusEl.textContent = toggleOpen ? "Toggles open" : "Toggles closed";
  }
  if (land === T.BTN_BLUE) {
    enemies.forEach(e => { if (e.type === "tank") e.dir = (e.dir + 2) % 4; });
    statusEl.textContent = "Tanks reversed!";
  }
  if (land === T.BTN_BROWN) {
    traps.forEach(tr => { tr.open = true; });
    statusEl.textContent = "Traps open!";
  }
  if (land === T.BTN_RED) {
    cloners.forEach(cl => {
      const cx = cl.x + DX[cl.dir], cy = cl.y + DY[cl.dir];
      if (inBounds(cx, cy) && !blockAt(cx, cy) && !solidToMonster({type:cl.template,dir:cl.dir}, cx, cy)) {
        enemies.push({ x: cx, y: cy, dir: cl.dir, type: cl.template, timer: 0, step: 0 });
      }
    });
    statusEl.textContent = "Cloned!";
  }

  if (land === T.TELEPORT && teleporters.length > 1) {
    const idx = teleporters.findIndex(tp => tp.x === lx && tp.y === ly);
    for (let i = 1; i <= teleporters.length; i++) {
      const tp = teleporters[(idx - i + teleporters.length * 2) % teleporters.length];
      const tx = tp.x + DX[dir], ty = tp.y + DY[dir];
      if (!solidToPlayer(tx, ty, dir)) {
        player.x = tx; player.y = ty;
        statusEl.textContent = "Teleport!";
        break;
      }
    }
  }

  const finalT = map[player.y][player.x];
  if (finalT === T.FIRE && !inv.boots.fire) { gameState = "dead"; showScreen(gameOver); return; }
  if (finalT === T.WATER && !inv.boots.flip) { gameState = "dead"; showScreen(gameOver); return; }

  if (finalT === T.EXIT) {
    if (chipsCollected >= chipsNeeded) {
      if (customLevel || fromEditor) {
        gameState = "win"; showScreen(winScreen);
        winScreen.querySelector("p").textContent = fromEditor ? "Custom level cleared!" : "Custom cleared!";
      } else if (level >= LEVELS.length - 1) {
        gameState = "win"; showScreen(winScreen);
        winScreen.querySelector("p").textContent = "Joe juked through all levels!";
      } else {
        gameState = "levelDone"; showScreen(levelComplete);
      }
    } else statusEl.textContent = "Need more chips!";
  }

  if (enemies.some(e => e.x === player.x && e.y === player.y) ||
      blocks.some(b => b.x === player.x && b.y === player.y)) {
    gameState = "dead"; showScreen(gameOver);
  }
}

function turnLeft(d) { return (d + 3) % 4; }
function turnRight(d) { return (d + 1) % 4; }
function turnAround(d) { return (d + 2) % 4; }

function pickMonsterDir(e) {
  const can = (d) => !solidToMonster(e, e.x + DX[d], e.y + DY[d]);
  if (e.type === "ball" || e.type === "tank") {
    return can(e.dir) ? e.dir : turnAround(e.dir);
  }
  if (e.type === "glider") {
    for (const d of [e.dir, turnLeft(e.dir), turnRight(e.dir), turnAround(e.dir)])
      if (can(d)) return d;
    return e.dir;
  }
  if (e.type === "fireball") {
    for (const d of [e.dir, turnRight(e.dir), turnLeft(e.dir), turnAround(e.dir)])
      if (can(d)) return d;
    return e.dir;
  }
  if (e.type === "bug") {
    for (const d of [turnLeft(e.dir), e.dir, turnRight(e.dir), turnAround(e.dir)])
      if (can(d)) return d;
    return e.dir;
  }
  if (e.type === "paramecium") {
    for (const d of [turnRight(e.dir), e.dir, turnLeft(e.dir), turnAround(e.dir)])
      if (can(d)) return d;
    return e.dir;
  }
  if (e.type === "walker" || e.type === "blob") {
    const opts = [0,1,2,3].filter(can);
    if (!opts.length) return e.dir;
    if (can(e.dir) && e.type === "walker" && Math.random() < 0.5) return e.dir;
    return opts[Math.floor(Math.random() * opts.length)];
  }
  if (e.type === "teeth") {
    const adx = player.x - e.x, ady = player.y - e.y;
    const prefer = [];
    if (Math.abs(adx) >= Math.abs(ady)) {
      prefer.push(adx > 0 ? DIR.E : DIR.W, ady > 0 ? DIR.S : DIR.N);
    } else {
      prefer.push(ady > 0 ? DIR.S : DIR.N, adx > 0 ? DIR.E : DIR.W);
    }
    prefer.push(e.dir, turnLeft(e.dir), turnRight(e.dir), turnAround(e.dir));
    for (const d of prefer) if (can(d)) return d;
    return e.dir;
  }
  return can(e.dir) ? e.dir : turnAround(e.dir);
}

function updateEnemies(dt) {
  for (const e of enemies.slice()) {
    if (!enemies.includes(e)) continue;
    e.timer += dt;
    const interval = e.type === "teeth" || e.type === "blob" ? 0.5 : 0.38;
    if (e.timer < interval) continue;
    e.timer = 0;
    e.step++;

    if (isClosedTrap(e.x, e.y)) continue;
    if (e.type === "teeth" && e.step % 2 === 0) continue;

    let d = pickMonsterDir(e);
    e.dir = d;
    const nx = e.x + DX[d], ny = e.y + DY[d];
    if (solidToMonster(e, nx, ny)) continue;

    const nt = map[ny][nx];
    if (isSlide(nt)) {
      const fin = slidePath(nx, ny, d, false, e);
      e.x = fin.x; e.y = fin.y; e.dir = fin.dir;
    } else {
      e.x = nx; e.y = ny;
    }

    const landT = map[e.y][e.x];
    if (landT === T.BOMB) {
      map[e.y][e.x] = T.FLOOR;
      enemies = enemies.filter(en => en !== e);
      continue;
    }
    if (landT === T.WATER && e.type !== "glider") {
      enemies = enemies.filter(en => en !== e);
      continue;
    }
    if (landT === T.FIRE && e.type !== "fireball") {
      enemies = enemies.filter(en => en !== e);
      continue;
    }

    if (e.x === player.x && e.y === player.y) {
      gameState = "dead"; showScreen(gameOver);
    }
  }
}

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

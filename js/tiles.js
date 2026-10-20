/**
 * Joe's Juke — special floor / ice / force tile helpers
 */
"use strict";

function isIce(t) {
  return t === T.ICE || t === T.ICE_NW || t === T.ICE_NE || t === T.ICE_SW || t === T.ICE_SE;
}

function isForce(t) {
  return t === T.FORCE_N || t === T.FORCE_E || t === T.FORCE_S || t === T.FORCE_W || t === T.FORCE_R;
}

function forceDirOf(t) {
  if (t === T.FORCE_N) return DIR.N;
  if (t === T.FORCE_E) return DIR.E;
  if (t === T.FORCE_S) return DIR.S;
  if (t === T.FORCE_W) return DIR.W;
  if (t === T.FORCE_R) return Math.floor(Math.random() * 4);
  return -1;
}

function iceRedirect(t, dir) {
  if (t === T.ICE_NW) { if (dir === DIR.N) return DIR.E; if (dir === DIR.W) return DIR.S; }
  if (t === T.ICE_NE) { if (dir === DIR.N) return DIR.W; if (dir === DIR.E) return DIR.S; }
  if (t === T.ICE_SW) { if (dir === DIR.S) return DIR.E; if (dir === DIR.W) return DIR.N; }
  if (t === T.ICE_SE) { if (dir === DIR.S) return DIR.W; if (dir === DIR.E) return DIR.N; }
  return dir;
}

function canEnterIceCorner(t, dir) {
  if (t === T.ICE_NW) return !(dir === DIR.S || dir === DIR.E);
  if (t === T.ICE_NE) return !(dir === DIR.S || dir === DIR.W);
  if (t === T.ICE_SW) return !(dir === DIR.N || dir === DIR.E);
  if (t === T.ICE_SE) return !(dir === DIR.N || dir === DIR.W);
  return true;
}

function isSlide(t) {
  return isIce(t) || isForce(t);
}

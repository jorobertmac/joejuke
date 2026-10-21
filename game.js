/**
 * Joe's Juke — game.js loader (fetches compressed payload parts, expands, evals)
 */
"use strict";
(function () {
  function b64ToU8(s) {
    var bin = atob(s);
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }
  function run(code) { (0, eval)(code); }
  function fail(msg) {
    console.error(msg);
    var el = document.getElementById("loadError");
    if (el) { el.classList.remove("hidden"); el.textContent = msg; }
  }
  if (typeof DecompressionStream === "undefined") {
    fail("Browser too old for game loader");
    return;
  }
  Promise.all([
    fetch("game.payload.1.b64").then(function (r) { if (!r.ok) throw new Error("p1 " + r.status); return r.text(); }),
    fetch("game.payload.2.b64").then(function (r) { if (!r.ok) throw new Error("p2 " + r.status); return r.text(); })
  ]).then(function (parts) {
    var b64 = parts[0].trim() + parts[1].trim();
    var u8 = b64ToU8(b64);
    var ds = new DecompressionStream("deflate");
    var stream = new Response(u8).body.pipeThrough(ds);
    return new Response(stream).text();
  }).then(function (code) { run(code); })
    .catch(function (err) { fail("Failed to load game: " + (err && err.message ? err.message : err)); });
})();

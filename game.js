/**
 * Joe's Juke — game.js loader (fetches compressed payload, expands, evals)
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
  fetch("game.payload.b64")
    .then(function (r) {
      if (!r.ok) throw new Error("payload HTTP " + r.status);
      return r.text();
    })
    .then(function (b64) {
      var u8 = b64ToU8(b64.trim());
      var ds = new DecompressionStream("deflate");
      var stream = new Response(u8).body.pipeThrough(ds);
      return new Response(stream).text();
    })
    .then(function (code) { run(code); })
    .catch(function (err) { fail("Failed to load game: " + (err && err.message ? err.message : err)); });
})();

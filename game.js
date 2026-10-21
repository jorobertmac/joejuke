/**
 * Bootstrap — load full game from last good commit until main is restored
 */
"use strict";
(function () {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/jorobertmac/joejuke@2f23214254e5fc5b617fedd57460d390d09a511e/game.js";
  s.onload = function () { console.log("game.js loaded from @2f23214"); };
  s.onerror = function () {
    var el = document.getElementById("loadError");
    if (el) { el.classList.remove("hidden"); el.textContent = "Failed to load game core."; }
  };
  document.head.appendChild(s);
})();

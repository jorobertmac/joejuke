/**
 * Keyboard navigation for start menu and editor palette.
 * Loaded after game.js; patches keydown handling.
 */
(function () {
  "use strict";

  function getVisibleOverlay() {
    var ids = ["startScreen", "levelComplete", "gameOver", "winScreen", "exportModal", "importModal"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && !el.classList.contains("hidden")) return el;
    }
    return null;
  }

  function handleMenuKeys(e, container) {
    var key = e.key;
    if (key !== "ArrowUp" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowRight") return false;
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")) return false;
    var buttons = Array.prototype.slice.call(container.querySelectorAll("button:not(.hidden)"));
    if (!buttons.length) return false;
    var idx = buttons.indexOf(document.activeElement);
    if (key === "ArrowDown" || key === "ArrowRight") {
      idx = idx < 0 ? 0 : (idx + 1) % buttons.length;
    } else {
      idx = idx < 0 ? 0 : (idx - 1 + buttons.length) % buttons.length;
    }
    buttons[idx].focus();
    return true;
  }

  function handlePaletteNav(e) {
    var key = e.key;
    if (key !== "ArrowUp" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowRight") return false;
    var palette = document.getElementById("palette");
    if (!palette) return false;
    var btns = Array.prototype.slice.call(palette.querySelectorAll(".palette-btn"));
    if (!btns.length) return false;
    var idx = btns.indexOf(document.activeElement);
    if (idx < 0) {
      idx = btns.findIndex(function (b) { return b.classList.contains("active"); });
      if (idx < 0) idx = 0;
    }
    var first = btns[0];
    var gap = 6;
    var cols = Math.max(1, Math.floor((palette.clientWidth + gap) / (first.offsetWidth + gap)));
    var ni = idx;
    if (key === "ArrowRight") ni = Math.min(btns.length - 1, idx + 1);
    else if (key === "ArrowLeft") ni = Math.max(0, idx - 1);
    else if (key === "ArrowDown") ni = Math.min(btns.length - 1, idx + cols);
    else if (key === "ArrowUp") ni = Math.max(0, idx - cols);
    btns[ni].focus();
    if (typeof btns[ni].scrollIntoView === "function") {
      btns[ni].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    return true;
  }

  window.addEventListener("keydown", function (e) {
    var state = typeof gameState !== "undefined" ? gameState : "";
    var overlay = getVisibleOverlay();
    if (overlay && state !== "play" && state !== "editor") {
      if (handleMenuKeys(e, overlay)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    }
    if (state === "editor") {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (handlePaletteNav(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }, true);

  // Focus start button on load
  window.addEventListener("load", function () {
    setTimeout(function () {
      if (typeof gameState !== "undefined" && gameState === "start") {
        var sb = document.getElementById("startBtn");
        if (sb) sb.focus();
      }
    }, 50);
  });
})();

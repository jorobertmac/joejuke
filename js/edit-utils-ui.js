/** Clear editor zoom when leaving via UI (safety net). */
(function () {
  function wire() {
    var exitEd = document.getElementById("exitEditorBtn");
    var exitPause = document.getElementById("exitPauseBtn");
    function clearZ() {
      if (typeof applyEditZoom === "function") applyEditZoom();
    }
    if (exitEd) exitEd.addEventListener("click", clearZ);
    if (exitPause) exitPause.addEventListener("click", clearZ);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else setTimeout(wire, 0);
})();

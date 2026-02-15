/**
 * Omar Maher Portfolio — Gamified portfolio mode
 * "Play Mode": missions / explore projects as levels (UI layer).
 */

(function () {
  const CONFIG = window.PORTFOLIO_CONFIG || {};
  const GAMIFIED = CONFIG.GAMIFIED || { missionCount: 10, unlockAfterProjects: 3 };

  let active = false;

  function getToggle() {
    return document.getElementById("gamified-toggle");
  }

  function getMain() {
    return document.getElementById("main-content");
  }

  function enterGamified() {
    const main = getMain();
    if (!main) return;
    main.classList.add("gamified-mode");
    main.setAttribute("aria-label", "Portfolio in gamified mission mode");
    const btn = getToggle();
    if (btn) {
      btn.textContent = "Exit Play Mode";
      btn.setAttribute("aria-label", "Exit gamified portfolio mode");
    }
    active = true;
  }

  function exitGamified() {
    const main = getMain();
    if (!main) return;
    main.classList.remove("gamified-mode");
    main.removeAttribute("aria-label");
    const btn = getToggle();
    if (btn) {
      btn.textContent = "Play Mode";
      btn.setAttribute("aria-label", "Enter gamified portfolio mode");
    }
    active = false;
  }

  function toggle() {
    active ? exitGamified() : enterGamified();
  }

  function init() {
    const btn = getToggle();
    if (!btn) return;
    btn.addEventListener("click", toggle);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

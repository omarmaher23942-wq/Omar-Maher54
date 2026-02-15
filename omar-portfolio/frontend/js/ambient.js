/**
 * Omar Maher Portfolio — Optional ambient sound
 * Calm background sound with mute toggle. User interaction required to start audio.
 */

(function () {
  var audio = null;
  var btn = null;
  var isMuted = true;

  var AMBIENT_URL = "https://assets.mixkit.co/active_storage/sfx/2560-ambient-lounge-chill-out-2560.mp3";

  function createToggle() {
    if (btn) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ambient-sound-btn glass-panel";
    btn.setAttribute("aria-label", "Toggle ambient sound");
    btn.innerHTML = "<span class=\"ambient-sound-icon\">🔊</span> Sound";
    btn.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:1000;padding:10px 16px;border-radius:12px;font-size:14px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);color:var(--color-text-secondary);";
    btn.addEventListener("click", toggleSound);
    document.body.appendChild(btn);
  }

  function toggleSound() {
    if (!audio) {
      audio = new Audio(AMBIENT_URL);
      audio.loop = true;
      audio.volume = 0.2;
    }
    isMuted = !isMuted;
    if (isMuted) {
      audio.pause();
      if (btn) btn.innerHTML = "<span class=\"ambient-sound-icon\">🔊</span> Sound";
    } else {
      audio.play().catch(function () {});
      if (btn) btn.innerHTML = "<span class=\"ambient-sound-icon\">🔇</span> Mute";
    }
  }

  function init() {
    createToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

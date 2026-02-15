/**
 * Omar Maher Portfolio — Main entry
 * Particles, mobile menu, and global behavior.
 */

(function () {
  function createParticles() {
    const container = document.getElementById("particles-container");
    if (!container) return;
    const count = 8;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "hero-bg__particle";
      container.appendChild(p);
    }
  }

  function initMobileMenu() {
    const btn = document.getElementById("menu-toggle");
    const nav = document.querySelector(".site-header__nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", !expanded);
      nav.classList.toggle("is-open");
    });
  }

  function initHeaderScroll() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y > 80) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
      lastY = y;
    }, { passive: true });
  }

  function init() {
    createParticles();
    initMobileMenu();
    initHeaderScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

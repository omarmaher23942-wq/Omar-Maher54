/**
 * Omar Maher Portfolio — Live AI terminal intro
 * Types out intro lines with a blinking cursor.
 */

(function () {
  const LINES = [
    { text: "whoami", type: "command" },
    { text: "Omar Maher — AI & Automation Engineer", type: "output" },
    { text: "", type: "output" },
    { text: "cat focus.txt", type: "command" },
    { text: "Building SaaS AI Agents & Automated Workflows.", type: "output" },
    { text: "n8n · Python · LLMs · Multi-Modal AI · System Design.", type: "output" },
    { text: "", type: "output" },
    { text: "echo $MISSION", type: "command" },
    { text: "Transform complex processes into reliable, scalable automation.", type: "output" },
  ];

  const container = document.getElementById("terminal-lines");
  const cursor = document.getElementById("terminal-cursor");
  if (!container) return;

  let lineIndex = 0;
  let charIndex = 0;
  const delayBetweenChars = 40;
  const delayBetweenLines = 600;

  function createLineEl(type) {
    const el = document.createElement("div");
    el.className = "terminal__line terminal__line--" + type;
    return el;
  }

  function typeNext() {
    if (lineIndex >= LINES.length) {
      if (cursor) cursor.style.animation = "none";
      return;
    }
    const line = LINES[lineIndex];
    if (!line.text) {
      lineIndex++;
      setTimeout(typeNext, delayBetweenLines);
      return;
    }
    if (charIndex === 0) {
      const el = createLineEl(line.type);
      container.appendChild(el);
      el.dataset.lineIndex = lineIndex;
    }
    const lineEl = container.querySelector(`[data-line-index="${lineIndex}"]`);
    if (!lineEl) return;
    if (charIndex < line.text.length) {
      lineEl.textContent += line.text[charIndex];
      charIndex++;
      setTimeout(typeNext, delayBetweenChars);
    } else {
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNext, delayBetweenLines);
    }
  }

  function start() {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) typeNext();
      },
      { threshold: 0.3 }
    );
    observer.observe(hero);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

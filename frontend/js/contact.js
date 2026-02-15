/**
 * Omar Maher Portfolio — Contact form
 * Submits to backend API; backend sends message to Telegram.
 */

(function () {
  const CONFIG = window.PORTFOLIO_CONFIG || {};
  const API_BASE = (CONFIG.API_BASE || "").replace(/\/$/, "");

  function init() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.querySelector("#contact-name");
      const email = form.querySelector("#contact-email");
      const subject = form.querySelector("#contact-subject");
      const message = form.querySelector("#contact-message");
      const submitBtn = form.querySelector('button[type="submit"]');
      const note = form.querySelector(".contact__form-note");

      if (!name?.value?.trim() || !email?.value?.trim() || !message?.value?.trim()) {
        if (note) note.textContent = "Please fill in name, email and message.";
        return;
      }

      const payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        subject: (subject && subject.value) ? subject.value.trim() : "",
        message: message.value.trim(),
      };

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      if (note) note.textContent = "";

      try {
        const res = await fetch(API_BASE + "/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          if (note) note.textContent = "Message sent. Omar will get it on Telegram.";
          form.reset();
        } else {
          if (note) note.textContent = data.error || "Something went wrong. Try email or WhatsApp.";
        }
      } catch (err) {
        if (note) note.textContent = "Network error. Please use email or WhatsApp: +201094321957";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

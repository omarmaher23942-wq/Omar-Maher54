/**
 * Omar Maher Portfolio — Shoghlana AI Chat
 * Connects to n8n webhook for live AI responses.
 */

(function () {
  const WEBHOOK_URL = "https://omarmaherabdelaziz.app.n8n.cloud/webhook/54f1f9e5-4ba0-4318-a7d6-8c7399f9034e";

  var chatModal = null;
  var chatMessages = null;
  var chatInput = null;
  var chatSend = null;
  var chatClose = null;

  function createModal() {
    if (chatModal) return chatModal;
    var wrap = document.createElement("div");
    wrap.id = "shoghlana-chat-wrap";
    wrap.className = "shoghlana-chat-wrap";
    wrap.innerHTML =
      "<div class=\"shoghlana-chat-backdrop\" data-close-chat></div>" +
      "<div class=\"shoghlana-chat-panel glass-panel\">" +
      "<div class=\"shoghlana-chat-header\">" +
      "<h3>شغلانة — AI Chat</h3>" +
      "<button type=\"button\" class=\"shoghlana-chat-close\" aria-label=\"Close\" data-close-chat>×</button>" +
      "</div>" +
      "<div class=\"shoghlana-chat-messages\" id=\"shoghlana-chat-messages\"></div>" +
      "<div class=\"shoghlana-chat-footer\">" +
      "<input type=\"text\" class=\"shoghlana-chat-input\" id=\"shoghlana-chat-input\" placeholder=\"اكتب رسالتك...\" autocomplete=\"off\" />" +
      "<button type=\"button\" class=\"btn btn-primary shoghlana-chat-send\" id=\"shoghlana-chat-send\">إرسال</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    chatModal = wrap;
    chatMessages = document.getElementById("shoghlana-chat-messages");
    chatInput = document.getElementById("shoghlana-chat-input");
    chatSend = document.getElementById("shoghlana-chat-send");
    chatClose = wrap.querySelector("[data-close-chat]");
    return wrap;
  }

  function openChat() {
    createModal();
    chatModal.classList.add("shoghlana-chat-wrap--open");
    document.body.style.overflow = "hidden";
    if (chatMessages.children.length === 0) {
      appendMessage("assistant", "مرحباً! أنا مساعد شغلانة. اسألني عن التوظيف أو الأتمتة أو أي سؤال.");
    }
    setTimeout(function () { if (chatInput) chatInput.focus(); }, 100);
  }

  function closeChat() {
    if (!chatModal) return;
    chatModal.classList.remove("shoghlana-chat-wrap--open");
    document.body.style.overflow = "";
  }

  function appendMessage(role, text) {
    if (!chatMessages) return;
    var div = document.createElement("div");
    div.className = "shoghlana-chat-msg shoghlana-chat-msg--" + role;
    div.innerHTML = "<span class=\"shoghlana-chat-msg-bubble\">" + escapeHtml(text) + "</span>";
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function setLoading(loading) {
    if (!chatSend) return;
    chatSend.disabled = loading;
    chatSend.textContent = loading ? "..." : "إرسال";
  }

  function sendMessage() {
    var text = (chatInput && chatInput.value) ? chatInput.value.trim() : "";
    if (!text) return;
    appendMessage("user", text);
    if (chatInput) chatInput.value = "";
    setLoading(true);
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, chatInput: text }),
    })
      .then(function (r) {
        return r.text().then(function (raw) {
          var d = null;
          try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = raw; }
          return { ok: r.ok, data: d };
        });
      })
      .then(function (result) {
        var reply = "";
        var d = result.data;
        if (result.ok && d) {
          if (Array.isArray(d) && d[0] && d[0].json) d = d[0].json;
          if (typeof d.output === "string") reply = d.output;
          else if (d.message) reply = d.message;
          else if (d.text) reply = d.text;
          else if (d.reply) reply = d.reply;
          else if (d.response) reply = d.response;
          else if (d.output && d.output.message) reply = d.output.message;
          else if (d.chatOutput) reply = d.chatOutput;
          else if (typeof d === "string") reply = d;
          else reply = JSON.stringify(d);
        } else {
          reply = "عذراً، لم أستطع الحصول على رد. جرّب مرة أخرى أو راسلني على الواتساب.";
        }
        appendMessage("assistant", reply || "تم استلام رسالتك.");
      })
      .catch(function () {
        appendMessage("assistant", "حدث خطأ في الاتصال. تأكد من الاتصال بالإنترنت أو تواصل معي عبر الواتساب.");
      })
      .finally(function () {
        setLoading(false);
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      });
  }

  function init() {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.getAttribute("data-open-shoghlana-chat") !== null) {
        e.preventDefault();
        openChat();
      }
      if (e.target && e.target.closest && e.target.closest("[data-close-chat]")) {
        closeChat();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeChat();
    });
    document.body.addEventListener("click", function (e) {
      if (e.target && e.target.id === "shoghlana-chat-send") { e.preventDefault(); sendMessage(); }
    });
    document.body.addEventListener("keydown", function (e) {
      if (e.target && e.target.id === "shoghlana-chat-input" && e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  init();
})();

/**
 * Omar Maher Portfolio — Projects grid
 * Renders project cards immediately; no dependency on API for visibility.
 */

(function () {
  const CONFIG = window.PORTFOLIO_CONFIG || {};
  const API_BASE = CONFIG.API_BASE || "";
  const gridId = "projects-grid";

  const FALLBACK_PROJECTS = [
    { id: "shoghlana", title: "Shoghlana — AI Recruitment SaaS", tagline: "منصة توظيف ذكية مؤتمتة بالذكاء الاصطناعي لربط العملاء بالمواهب", category: "SaaS · AI · Automation", year: "2024", technologies: ["n8n", "LLMs", "AI Agents", "Google Sheets"], demoLink: "https://omarmaher23942-wq.github.io/Omar-Maher65/", link: "https://t.me/sho_8_lana_b", image: "assets/images/projects/shoghlana.jpg", hasChat: true },
    { id: "meta-support", title: "Meta Customer Support AI System", tagline: "منظومة دعم فني ذكية متعددة الوسائط", category: "AI · Support · Multi-Modal", year: "2024", technologies: ["n8n", "AI Agents", "Multi-Modal AI", "Gmail"], link: "https://t.me/meta_customer_support_bot", image: "assets/images/projects/meta-support.jpg" },
    { id: "koshary-abu-tarek", title: "كشري أبو طارق — Multi-Modal AI Restaurant", tagline: "منصة أتمتة طلبات مطاعم متعددة القنوات والوسائط", category: "Enterprise · F&B", year: "2024", technologies: ["n8n", "Multi-Modal AI", "Google Workspace"], link: "https://t.me/koshari_abo_tarek_bot", image: "assets/images/projects/koshary.jpg" },
    { id: "my-doctor", title: "طبيبي الذكي — AI Doctor Booking", tagline: "نظام حجز أطباء ذكي بالذكاء الاصطناعي", category: "Healthcare · AI", year: "2024", technologies: ["n8n", "AI Agents", "Telegram Bot", "Google Sheets"], image: "assets/images/projects/my-doctor.jpg" },
    { id: "smart-job-automation", title: "أتمتة ذكية لتجميع الوظائف", tagline: "جلب من مستقل، تصنيف بـ LLM، إرسال الوظائف المناسبة", category: "Automation · LLM", year: "2024", technologies: ["n8n", "LLM", "RSS/Feeds"], image: "assets/images/projects/job-aggregation.jpg" },
    { id: "multi-modal-orchestrator", title: "Multi-Modal AI Orchestrator Agent", tagline: "نص، صوت، صورة عبر WhatsApp → توجيه لـ Agents متخصصة", category: "AI · Orchestration", year: "2024", technologies: ["Multi-Modal AI", "Orchestration", "WhatsApp"], image: "assets/images/projects/orchestrator.jpg" },
    { id: "smart-sip-galaxy", title: "Smart Sip Galaxy 2026", tagline: "معرض مشروبات ذكي متعدد اللغات، Glassmorphism، 5 لغات", category: "Frontend · i18n · UX", year: "2025", technologies: ["HTML5", "CSS3", "JavaScript ES6+"], image: "assets/images/projects/smart-sip.jpg" },
    { id: "ai-crm-automation", title: "AI CRM Automation System", tagline: "CRM workflows and lead routing with AI", category: "CRM · AI · BPA", year: "2024", technologies: ["n8n", "AI Agents", "CRM APIs"], image: "assets/images/projects/crm.jpg" },
    { id: "telegram-lead-routing", title: "Telegram Lead Routing AI", tagline: "توجيه وتأهيل العملاء المحتملين", category: "AI · Sales", year: "2024", technologies: ["n8n", "LLMs", "Google Sheets"], image: "assets/images/projects/telegram-leads.jpg" },
    { id: "enterprise-workflows", title: "Custom Enterprise Workflow Automations", tagline: "أتمتة سير عمل مخصصة للمؤسسات", category: "Enterprise · BPA", year: "2024", technologies: ["n8n", "Python", "Webhooks", "REST APIs"], image: "assets/images/projects/enterprise.jpg" },
  ];

  function getImageUrl(project) {
    return project.image || "assets/images/projects/placeholder.svg";
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCard(project, index) {
    const link = project.demoLink || project.link || "#";
    const tech = (project.technologies || []).slice(0, 5);
    const tags = tech.map(function (t) { return "<span class=\"project-card__tag\">" + escapeHtml(t) + "</span>"; }).join("");
    const placeSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect fill='%2316161f' width='400' height='250'/%3E%3Ctext fill='%23606070' font-size='14' x='200' y='125' text-anchor='middle'%3EProject%3C/text%3E%3C/svg%3E";
    const dataAttrs = "data-project-id=\"" + escapeHtml(project.id) + "\" data-index=\"" + index + "\"";
    const cardClass = "project-card project-card--enter card-glow-hover" + (project.hasChat ? " project-card--has-chat" : "");
    return "<article class=\"" + cardClass + "\" " + dataAttrs + ">" +
      "<img src=\"" + escapeHtml(getImageUrl(project)) + "\" alt=\"\" class=\"project-card__image\" onerror=\"this.src='" + placeSvg + "'\" />" +
      "<div class=\"project-card__body\">" +
      "<span class=\"project-card__category\">" + escapeHtml(project.category) + " · " + escapeHtml(project.year || "") + "</span>" +
      "<h3 class=\"project-card__title\">" + escapeHtml(project.title) + "</h3>" +
      "<p class=\"project-card__tagline\">" + escapeHtml(project.tagline || "") + "</p>" +
      "<div class=\"project-card__tags\">" + tags + "</div>" +
      (project.hasChat ? "<button type=\"button\" class=\"project-card__chat-btn\" data-open-shoghlana-chat>تجربة AI Chat</button>" : "") +
      "<a href=\"" + escapeHtml(link) + "\" target=\"_blank\" rel=\"noopener\" class=\"project-card__link\">View project →</a>" +
      "</div></article>";
  }

  function render(projects) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = projects.map(renderCard).join("");
    grid.classList.add("projects__grid--loaded");
    setTimeout(function () {
      grid.querySelectorAll(".project-card--enter").forEach(function (el, i) {
        el.style.animationDelay = (i * 0.08) + "s";
      });
    }, 50);
  }

  function fetchAndRender() {
    function doRender(list) {
      render(Array.isArray(list) ? list : FALLBACK_PROJECTS);
    }
    if (API_BASE) {
      fetch(API_BASE + "/api/projects").then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(doRender).catch(function () { doRender(FALLBACK_PROJECTS); });
    } else {
      doRender(FALLBACK_PROJECTS);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchAndRender);
  } else {
    fetchAndRender();
  }
})();

/* ROADMAP_INDEX
Phase 1 Foundation & Scaffolding
- Goals: single-file monolith bootstrap, runtime config, HTTP routing, baseline security, request tracing, metrics endpoint, HTML shell.
- Deliverables: Node server, JSON logger, healthz, metrics placeholders, strict headers, initial UI shell.
- NFR: low-latency startup, defensive parsing, no external build step.
- DoD: app runs with `node portfolio-os.mjs`; `/healthz` and `/metrics` respond.
- Risks: token leakage, abuse traffic, malformed payloads.
- Mitigations: env-only secrets, per-IP throttling, schema validation.
- Checkpoints: CP-001 runtime config, CP-002 request id + logs, CP-003 base routes.

Phase 2 Design System & Core UI
- Goals: cinematic UI tokens, container-query layout, accessibility-first primitives.
- Deliverables: CSS layers, theme tokens, command palette, projects filter/search shell.
- NFR: WCAG-aligned contrast, reduced-motion support, keyboard-first UX.
- DoD: hero/projects/contact shells with command palette and client-state runtime.
- Risks: animation overhead, accessibility regressions.
- Mitigations: motion budget + adaptive frame scheduling + ARIA landmarks.
- Checkpoints: CP-010 design tokens, CP-011 command palette, CP-012 project explorer.

Phase 3 Data Layer & CMS
- Goals: schema-driven content state with admin-safe mutations.
- Deliverables: JSON schema validator + import/export.
- NFR: deterministic validation errors.
- DoD: CRUD workflow with persistence hooks.
- Risks: corrupt payloads.
- Mitigations: strict validator + snapshots.
- Checkpoints: CP-020..CP-029.

Phase 4 Telegram Bot Integration
- Goals: notification pipeline + bot commands routing.
- Deliverables: `/start,/projects,/status,/notify,/deploy,/metrics` handlers.
- NFR: secret hygiene + retry strategy.
- DoD: verified outbound messaging for contact events + bot command handlers.
- Risks: API throttling.
- Mitigations: queue + backoff.
- Checkpoints: CP-030..CP-039.

Phase 5 Observability
- Goals: structured logs, trace context, service metrics.
- Deliverables: trace id propagation + RED counters.
- NFR: low overhead.
- DoD: request correlation across endpoints and web-vitals placeholders.
- Risks: noisy logs.
- Mitigations: sampled debug levels.
- Checkpoints: CP-040..CP-049.

Phase 6 Admin Mode
Phase 7 Performance & Security Hardening
Phase 8 QA & Test Harness
Phase 9 Polish & Motion
Phase 10 Release Checklist
*/

/* CHECKPOINTS
[done] CP-001 config/env parsing
[done] CP-002 logger + correlation ids
[done] CP-003 base HTTP routes + metrics stub
[done] CP-010 design system tokens + layered CSS
[done] CP-011 command palette (Ctrl+K)
[done] CP-012 project explorer filters + instant search
[pending] CP-020 CMS schema runtime
[pending] CP-030 Telegram bot command webhooks
*/

/* LAST_DONE: Phase 2 core UI shell implemented with keyboard-first interactions and dynamic project explorer. */
/* NEXT_UP: Phase 3 data schema runtime + admin CRUD and import/export JSON. */

// PART 0002 / 10000
// FILE: portfolio-os.mjs (SINGLE FILE ONLY)

import crypto from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';

/** @typedef {{ port:number, telegramToken:string, telegramChatId:string, adminIds:Set<string>, enableOtel:boolean, rateLimitPerMinute:number }} AppConfig */
/** @typedef {{ id:string, title:string, category:string, impact:string, stack:string[], summary:string }} Project */

/** @returns {AppConfig} */
function loadConfig() {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return {
    port,
    telegramToken: process.env.TELEGRAM_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    adminIds: new Set((process.env.ADMIN_IDS || '').split(',').map((v) => v.trim()).filter(Boolean)),
    enableOtel: process.env.OTEL_ENABLED === '1',
    rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE || 90),
  };
}

const config = loadConfig();
const metrics = {
  startedAt: Date.now(),
  requestsTotal: 0,
  requestsByRoute: new Map(),
  errorsTotal: 0,
  contactMessages: 0,
};

const content = {
  projects: /** @type {Project[]} */ ([
    { id: 'shoghlana', title: 'Shoghlana AI Recruitment', category: 'SaaS', impact: '20+ flows automated', stack: ['n8n', 'LLMs', 'Telegram'], summary: 'Omni-channel recruitment automation with smart matching and lead routing.' },
    { id: 'meta-support', title: 'Meta Customer Support AI', category: 'Automation', impact: 'Multi-modal triage', stack: ['Telegram', 'Google Sheets', 'Gmail'], summary: 'AI dispatches support requests to specialist bots with identity verification workflow.' },
    { id: 'my-doctor', title: 'My Doctor Booking AI', category: 'HealthTech', impact: 'Faster booking ops', stack: ['AI Agents', 'n8n', 'Sheets'], summary: 'Booking and follow-up orchestration for clinics and patients.' },
    { id: 'koshary', title: 'Koshary Abu Tarek Ordering', category: 'FoodTech', impact: 'Upsell automation', stack: ['Multi-modal AI', 'Telegram'], summary: 'Order intelligence, upsell scoring, and operational automation.' },
  ]),
};

const rateBucket = new Map();

function requestId() {
  return crypto.randomUUID();
}

function log(level, message, ctx = {}) {
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), level, message, ...ctx })}\n`);
}

function withSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.telegram.org",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; '));
}

function json(res, status, body) {
  withSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isRateLimited(ip) {
  const now = Date.now();
  const history = (rateBucket.get(ip) || []).filter((t) => t > now - 60_000);
  history.push(now);
  rateBucket.set(ip, history);
  return history.length > config.rateLimitPerMinute;
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function escapeHtml(input) {
  return input.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] || m);
}

function renderProjectSeed() {
  return JSON.stringify(content.projects).replace(/</g, '\\u003c');
}

function renderApp() {
  const links = {
    linkedin: 'https://www.linkedin.com/in/omarmaher23941',
    facebook: 'https://www.facebook.com/share/1aaHdsW9oo/?mibextid=wwXIfr',
    email: 'omarmaher23942@gmail.com',
    mostaql: 'https://mostaql.com/u/omarmaher_23942',
    behance: 'https://www.behance.net/omarmaher23942',
    whatsapp: '+201094321957',
  };
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Omar Maher — Portfolio OS</title>
  <meta name="description" content="AI & Automation Engineer | SaaS AI Agents & Automated Workflows" />
  <style>
    @layer reset, tokens, base, components, motion, utilities;
    @layer reset { *,*::before,*::after{box-sizing:border-box} }
    @layer tokens {
      :root {
        --bg:#060914; --surface:#111a2f; --surface-2:#0d1528; --text:#ebf1ff; --muted:#9fb3d5;
        --brand:#4ec9ff; --brand-2:#a47bff; --ok:#46e6a4; --warn:#ffb84d;
        --radius-2:12px; --radius-3:18px; --s-2:.5rem; --s-3:.75rem; --s-4:1rem; --s-6:1.5rem; --s-8:2rem;
        --shadow:0 20px 60px rgba(0,0,0,.35); --max:1200px;
      }
    }
    @layer base {
      html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
      body{min-height:100dvh;background-image:radial-gradient(1200px 700px at 100% -10%, #292f71, transparent), radial-gradient(900px 500px at -10% 20%, #143e74, transparent)}
      a{color:inherit}
      .container{width:min(var(--max),92vw);margin-inline:auto}
      .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
      :focus-visible{outline:2px solid var(--brand);outline-offset:2px}
    }
    @layer components {
      header{position:sticky;top:0;background:color-mix(in oklab,var(--bg) 78%, transparent);backdrop-filter: blur(8px);z-index:30;border-bottom:1px solid #23314e}
      nav{display:flex;align-items:center;justify-content:space-between;padding:.85rem 0}
      .badge{padding:.3rem .7rem;border:1px solid #2b3a5a;border-radius:999px;color:var(--muted);font-size:.83rem}
      .hero{padding:4.5rem 0 2rem}
      .hero-card{background:color-mix(in oklab,var(--surface) 80%, transparent);border:1px solid #2a3d67;border-radius:var(--radius-3);padding:var(--s-8);box-shadow:var(--shadow)}
      h1{font-size:clamp(2rem,5.2vw,4rem);line-height:1.1;margin:0}
      .lead{color:var(--muted);line-height:1.8;font-size:1.05rem}
      .stack{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1rem}
      .chip{padding:.42rem .75rem;background:#0d223f;border:1px solid #2d4f80;border-radius:999px;font-size:.85rem}
      .toolbar{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1.2rem}
      .input, .select, .btn{background:#0f1a2f;border:1px solid #2c3d60;color:var(--text);border-radius:10px;padding:.66rem .8rem}
      .input{min-width:min(100%, 320px)}
      .btn{cursor:pointer}
      .grid{display:grid;gap:1rem;grid-template-columns:repeat(12,minmax(0,1fr));container-type:inline-size;margin-top:1rem}
      .card{grid-column:span 6;background:var(--surface-2);border:1px solid #253658;border-radius:14px;padding:1rem}
      .card h3{margin:.2rem 0 .6rem}
      .meta{display:flex;gap:.4rem;flex-wrap:wrap;color:var(--muted);font-size:.86rem}
      .kbd{font-family:ui-monospace,Consolas,monospace;font-size:.8rem;padding:.1rem .4rem;border:1px solid #344c73;border-radius:8px;background:#0e1b33}
      .palette{position:fixed;inset:0;background:rgba(2,6,18,.72);display:none;place-items:start center;padding-top:12vh;z-index:40}
      .palette.open{display:grid}
      .palette-panel{width:min(760px,92vw);background:#0b1426;border:1px solid #2b4169;border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
      .palette-search{width:100%;padding:1rem;border:0;background:#0f1e39;color:var(--text);font-size:1rem}
      .palette-list{max-height:45vh;overflow:auto}
      .palette-item{display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;border-top:1px solid #1f3150}
      .contact{margin:2rem 0 3rem;background:#0d172c;border:1px solid #24385f;border-radius:14px;padding:1rem}
      .links{display:grid;gap:.5rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));color:var(--muted)}
      @container (max-width: 860px){ .card{grid-column:span 12} }
    }
    @layer motion {
      .hero-card{animation:floatUp .6s ease both}
      @keyframes floatUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
    }
    @layer utilities { .mt-2{margin-top:var(--s-2)} .mt-4{margin-top:var(--s-4)} .muted{color:var(--muted)} }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <nav aria-label="Main navigation">
        <strong>Portfolio OS</strong>
        <div class="badge" aria-label="command palette hint">افتح الأوامر: <span class="kbd">Ctrl</span> + <span class="kbd">K</span></div>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="hero" aria-labelledby="hero-title">
      <article class="hero-card">
        <h1 id="hero-title">Omar Maher — AI & Automation Engineer</h1>
        <p class="lead">Building SaaS AI Agents, Multi-Agent Orchestration, and Automated Workflows for businesses with Python, n8n, and full-stack engineering.</p>
        <div class="stack" aria-label="core skills">
          <span class="chip">AI Agents</span><span class="chip">Workflow Automation</span><span class="chip">n8n</span><span class="chip">Python</span><span class="chip">LLMs</span><span class="chip">Full-Stack</span>
        </div>
      </article>
    </section>

    <section aria-labelledby="projects-title">
      <h2 id="projects-title">Projects Explorer</h2>
      <div class="toolbar">
        <input id="search" class="input" placeholder="ابحث عن مشروع، تقنية، أو تأثير..." autocomplete="off" />
        <select id="category" class="select" aria-label="filter by category">
          <option value="all">All categories</option>
          <option value="SaaS">SaaS</option>
          <option value="Automation">Automation</option>
          <option value="HealthTech">HealthTech</option>
          <option value="FoodTech">FoodTech</option>
        </select>
        <button id="toggleTheme" class="btn" type="button">Toggle Theme</button>
      </div>
      <div id="projectsGrid" class="grid" role="list" aria-live="polite"></div>
    </section>

    <section class="contact" aria-labelledby="contact-title">
      <h2 id="contact-title">Contact</h2>
      <p class="muted">LinkedIn, WhatsApp, Email, and portfolio channels.</p>
      <div class="links">
        <a href="${escapeHtml(links.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="${escapeHtml(links.facebook)}" target="_blank" rel="noreferrer">Facebook</a>
        <a href="mailto:${escapeHtml(links.email)}">${escapeHtml(links.email)}</a>
        <a href="${escapeHtml(links.mostaql)}" target="_blank" rel="noreferrer">Mostaql</a>
        <a href="${escapeHtml(links.behance)}" target="_blank" rel="noreferrer">Behance</a>
        <a href="https://wa.me/201094321957" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </section>
  </main>

  <aside id="palette" class="palette" aria-hidden="true" aria-label="Command palette">
    <div class="palette-panel" role="dialog" aria-modal="true" aria-labelledby="palette-title">
      <label id="palette-title" class="sr-only" for="paletteSearch">Command Palette</label>
      <input id="paletteSearch" class="palette-search" placeholder="Type command..." />
      <div id="paletteList" class="palette-list"></div>
    </div>
  </aside>

  <script id="seed-projects" type="application/json">${renderProjectSeed()}</script>
  <script>
    (() => {
      /** @type {{id:string,title:string,category:string,impact:string,stack:string[],summary:string}[]} */
      const projects = JSON.parse(document.getElementById('seed-projects').textContent || '[]');
      const state = { query: '', category: 'all', theme: localStorage.getItem('theme') || 'dark', paletteOpen: false };

      const grid = document.getElementById('projectsGrid');
      const search = document.getElementById('search');
      const category = document.getElementById('category');
      const palette = document.getElementById('palette');
      const paletteSearch = document.getElementById('paletteSearch');
      const paletteList = document.getElementById('paletteList');

      const commands = [
        { id: 'go-projects', label: 'Jump to Projects', run: () => document.getElementById('projects-title').scrollIntoView({ behavior: 'smooth' }) },
        { id: 'go-contact', label: 'Jump to Contact', run: () => document.getElementById('contact-title').scrollIntoView({ behavior: 'smooth' }) },
        { id: 'theme-toggle', label: 'Toggle Theme', run: () => toggleTheme() },
        { id: 'focus-search', label: 'Focus Search', run: () => search.focus() },
      ];

      function applyTheme() {
        document.documentElement.dataset.theme = state.theme;
        if (state.theme === 'light') {
          document.documentElement.style.setProperty('--bg', '#f5f8ff');
          document.documentElement.style.setProperty('--surface', '#ffffff');
          document.documentElement.style.setProperty('--surface-2', '#edf3ff');
          document.documentElement.style.setProperty('--text', '#0a1122');
          document.documentElement.style.setProperty('--muted', '#405475');
        } else {
          document.documentElement.style.setProperty('--bg', '#060914');
          document.documentElement.style.setProperty('--surface', '#111a2f');
          document.documentElement.style.setProperty('--surface-2', '#0d1528');
          document.documentElement.style.setProperty('--text', '#ebf1ff');
          document.documentElement.style.setProperty('--muted', '#9fb3d5');
        }
      }

      function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', state.theme);
        applyTheme();
      }

      function filteredProjects() {
        const q = state.query.toLowerCase();
        return projects.filter((project) => {
          const categoryOk = state.category === 'all' || project.category === state.category;
          const text = [project.title, project.summary, project.impact, project.stack.join(' ')].join(' ').toLowerCase();
          const queryOk = !q || text.includes(q);
          return categoryOk && queryOk;
        });
      }

      function renderProjects() {
        const list = filteredProjects();
        grid.innerHTML = list.map((project) => {
          const chips = project.stack.map((s) => '<span class="chip">' + s + '</span>').join('');
          return '<article class="card" role="listitem">'
            + '<h3>' + project.title + '</h3>'
            + '<p class="muted">' + project.summary + '</p>'
            + '<div class="meta"><span>' + project.category + '</span><span>•</span><span>' + project.impact + '</span></div>'
            + '<div class="stack mt-2">' + chips + '</div>'
            + '</article>';
        }).join('') || '<p class="muted">No projects match current filters.</p>';
      }

      function openPalette() {
        state.paletteOpen = true;
        palette.classList.add('open');
        palette.setAttribute('aria-hidden', 'false');
        paletteSearch.value = '';
        renderCommands('');
        paletteSearch.focus();
      }

      function closePalette() {
        state.paletteOpen = false;
        palette.classList.remove('open');
        palette.setAttribute('aria-hidden', 'true');
      }

      function renderCommands(query) {
        const q = query.trim().toLowerCase();
        const list = commands.filter((c) => !q || c.label.toLowerCase().includes(q));
        paletteList.innerHTML = list.map((c, idx) => '<button class="palette-item btn" data-cmd="' + c.id + '" ' + (idx === 0 ? 'autofocus' : '') + '><span>' + c.label + '</span><span class="kbd">Enter</span></button>').join('');
      }

      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.id === 'toggleTheme') toggleTheme();
        const cmd = target.getAttribute('data-cmd');
        if (cmd) {
          const action = commands.find((c) => c.id === cmd);
          if (action) action.run();
          closePalette();
        }
        if (target === palette) closePalette();
      });

      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          state.paletteOpen ? closePalette() : openPalette();
        }
        if (event.key === 'Escape' && state.paletteOpen) closePalette();
      });

      paletteSearch.addEventListener('input', () => renderCommands(paletteSearch.value));
      search.addEventListener('input', () => { state.query = search.value; renderProjects(); });
      category.addEventListener('change', () => { state.category = category.value; renderProjects(); });

      applyTheme();
      renderProjects();
      performance.mark('portfolioos_ui_ready');
    })();
  </script>
</body>
</html>`;
}

async function notifyTelegram(text, reqId) {
  if (!config.telegramToken || !config.telegramChatId) return { skipped: true };
  const response = await fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: config.telegramChatId, text }),
  });
  if (!response.ok) throw new Error(`Telegram API failed (${response.status})`);
  log('info', 'telegram.notify.sent', { reqId });
  return { skipped: false };
}

const server = http.createServer(async (req, res) => {
  const reqId = requestId();
  const ip = req.socket.remoteAddress || 'unknown';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  metrics.requestsTotal += 1;
  metrics.requestsByRoute.set(url.pathname, (metrics.requestsByRoute.get(url.pathname) || 0) + 1);
  res.setHeader('X-Request-Id', reqId);

  try {
    if (isRateLimited(ip)) return json(res, 429, { error: 'rate_limited', reqId });

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return json(res, 200, { ok: true, uptimeSec: Math.floor((Date.now() - metrics.startedAt) / 1000), reqId });
    }

    if (req.method === 'GET' && url.pathname === '/metrics') {
      return json(res, 200, {
        requestsTotal: metrics.requestsTotal,
        errorsTotal: metrics.errorsTotal,
        contactMessages: metrics.contactMessages,
        requestsByRoute: Object.fromEntries(metrics.requestsByRoute.entries()),
        otelEnabled: config.enableOtel,
        reqId,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      return json(res, 200, { items: content.projects, count: content.projects.length, reqId });
    }

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      const body = await parseJsonBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();
      if (!name || !email.includes('@') || message.length < 10) return json(res, 400, { error: 'validation_failed', reqId });
      metrics.contactMessages += 1;
      await notifyTelegram(`New Contact\nName: ${name}\nEmail: ${email}\nMessage: ${message.slice(0, 1200)}`, reqId);
      return json(res, 202, { ok: true, reqId });
    }

    if (req.method === 'GET' && url.pathname === '/') {
      withSecurityHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
      return res.end(renderApp());
    }

    return json(res, 404, { error: 'not_found', reqId });
  } catch (error) {
    metrics.errorsTotal += 1;
    log('error', 'request.failed', { reqId, path: url.pathname, error: String(error) });
    return json(res, 500, { error: 'internal_error', reqId });
  } finally {
    log('info', 'request.completed', { reqId, method: req.method, path: url.pathname, ip });
  }
});

server.listen(config.port, () => {
  log('info', 'portfolio_os.ready', { port: config.port, otel: config.enableOtel });
});

/* COMPLETED_IN_THIS_PART
- Phase 2 implemented: elevated UI shell, command palette, projects explorer, theme switcher, /api/projects endpoint.
*/
/* OPEN_ITEMS
- CMS schema validation + admin CRUD and JSON import/export.
- Telegram bot command router (/start, /projects, /status, /notify, /deploy, /metrics).
- OTel trace propagation and test harness hooks.
*/
/* NEXT_PART_PLAN
- Build Phase 3 content schema engine and guarded admin APIs in the same file.
*/

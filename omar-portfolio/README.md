# Omar Maher — AI & Automation Engineer | Portfolio Platform

World-class SaaS-level portfolio website. Full-stack: Python backend, HTML/CSS/JS frontend, Telegram integration, gamified experience.

## Structure

- `backend/` — Python Flask API, contact form → Telegram, project data
- `frontend/` — Static site (HTML, CSS, JS).
- **صورتك الشخصية:** ضعها في `frontend/assets/images/omar-maher.png` (أو `.jpg`) — تم نسخ نسخة من صورتك تلقائياً إن وُجدت.
- **صور المشاريع:** ضعها في `frontend/assets/images/projects/` بأسماء مثل `shoghlana.jpg`, `meta-support.jpg`, `koshary.jpg`, `my-doctor.jpg`, إلخ.

## Run

```bash
# Backend (for contact form → Telegram)
cd backend
pip install -r requirements.txt
# Copy .env.example to .env and set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (or use the provided .env)
python app.py
```

Backend runs at `http://localhost:5000`. To use the contact form, either:
- Open `frontend/index.html` via a local server that allows CORS, or
- Set `window.PORTFOLIO_API_BASE = "http://localhost:5000"` before the other scripts when serving frontend.

**Frontend:** Open `frontend/index.html` in a browser, or serve the `frontend/` folder with any static server (e.g. `npx serve frontend`).

## Environment

`backend/.env` (do not commit; already in .gitignore):
- `TELEGRAM_BOT_TOKEN` — Your Telegram bot token
- `TELEGRAM_CHAT_ID` — Your Telegram chat ID for receiving contact messages

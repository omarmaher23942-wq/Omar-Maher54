"""
Omar Maher Portfolio — Backend API
Flask app: contact form → Telegram, project data, health check.
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["*"], allow_headers=["Content-Type"])

TELEGRAM_BOT_TOKEN = os.environ.get("8206954354:AAGSTMwljzsBOUgvtpHhnQw0ie8ku8QVOls", "")
TELEGRAM_CHAT_ID = os.environ.get("6227764526", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_telegram_message(text: str) -> bool:
    """Send a message to Omar's Telegram via the bot."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram credentials not set; skipping send.")
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        return True
    except Exception as e:
        logger.exception("Telegram send failed: %s", e)
        return False


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "omar-portfolio-api"})


@app.route("/api/contact", methods=["POST", "OPTIONS"])
def contact():
    if request.method == "OPTIONS":
        return "", 204
    try:
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        subject = (data.get("subject") or "").strip()
        message = (data.get("message") or "").strip()
        if not name or not email or not message:
            return jsonify({"success": False, "error": "Name, email and message are required"}), 400
        text = (
            "<b>New contact from Portfolio</b>\n\n"
            f"<b>Name:</b> {name}\n"
            f"<b>Email:</b> {email}\n"
            f"<b>Subject:</b> {subject or '—'}\n\n"
            f"<b>Message:</b>\n{message}"
        )
        ok = send_telegram_message(text)
        return jsonify({"success": ok})
    except Exception as e:
        logger.exception("Contact handler error: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@app.route("/api/projects", methods=["GET"])
def projects():
    """Return full project list for frontend (can be moved to DB later)."""
    from data.projects import get_projects
    return jsonify(get_projects())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")

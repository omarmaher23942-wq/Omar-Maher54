/**
 * Omar Maher Portfolio — Frontend configuration
 * API base URL and contact links; single source of truth.
 */

const CONFIG = Object.freeze({
  API_BASE: window.PORTFOLIO_API_BASE || "http://localhost:5000",
  CONTACT: {
    linkedin: "https://www.linkedin.com/in/omarmaher23941",
    facebook: "https://www.facebook.com/share/1aaHdsW9oo/?mibextid=wwXIfr",
    gmail: "mailto:omarmaher23942@gmail.com",
    mostaql: "https://mostaql.com/u/omarmaher_23942",
    behance: "https://www.behance.net/omarmaher23942",
    whatsapp: "https://wa.me/201094321957",
  },
  PROFILE: {
    fullName: "Omar Maher Abdel Aziz Mahmoud Abdel-Galil",
    title: "AI & Automation Engineer",
    tagline: "Building SaaS AI Agents & Automated Workflows for Businesses",
    location: "Egypt – Remote",
    email: "omarmaher23942@gmail.com",
    image: "assets/images/omar-maher.png",
    quote: "إن الله يحب إذا عمل أحدكم عملاً أن يتقنه",
    quoteSource: "رسول الله ﷺ",
  },
  GAMIFIED: {
    missionCount: 10,
    unlockAfterProjects: 3,
  },
});

window.PORTFOLIO_CONFIG = CONFIG;

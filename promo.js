/* 🏠 Lead Gurus - Fail-Safe Promo Script v1.7
   - Fully isolated from Leadshook internal errors
   - Uses your CSV feed
   - Shows fallback if Leadshook JS fails
*/

try {
  (function () {
    const CLIENT_NAME = document.currentScript.getAttribute("data-client");
    const VERTICAL = document.currentScript.getAttribute("data-vertical");
    const AUTHOR = "Lead Gurus";
    const FALLBACK_MESSAGE = "💰 Save Thousands for a Limited Time";
    const csvUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQi0b-DlbldAqnDEQ8KGSN_FW2NujnC43ePOHCfFuLCkKc0TKlJ9vHVZkRlZ676QOASvsW8ZnFBvkI3/pub?gid=1583681302&single=true&output=csv";

    const normalize = (str) =>
      str?.toString().normalize("NFD").replace(/[\u00A0]/g, " ").replace(/\s+/g, "").trim().toLowerCase();

    const showError = (msg) => {
      const el = document.getElementById("promo-header");
      if (el) el.textContent = msg;
      console.warn(msg);
    };

    function renderHeader(v, offer, color, author, customPromo = "", isFallback = false) {
      const h = document.getElementById("promo-header");
      if (!h) return showError("❌ promo-header element not found");

      Object.assign(h.style, {
        backgroundColor: color,
        color: "#fff",
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        padding: "10px 8px",
        lineHeight: "1.3",
      });

      const now = new Date();
      const y = now.getFullYear();
      const promos = [
        { name: `🎉 New Year ${v} Refresh`, start: `${y}-01-01`, end: `${y}-01-07` },
        { name: `❄️ Winter ${v} Upgrade`, start: `${y}-01-08`, end: `${y}-01-31` },
        { name: `💘 Sweetheart ${v} Sale`, start: `${y}-02-01`, end: `${y}-02-13` },
        { name: `💝 Valentine’s ${v} Sale`, start: `${y}-02-14`, end: `${y}-02-20` },
        { name: `🎃 Halloween ${v} Sale`, start: `${y}-10-16`, end: `${y}-10-31` },
        { name: `🖤 Black Friday ${v} Sale`, start: `${y}-11-25`, end: `${y}-11-30` },
        { name: `🎆 Year-End ${v} Sale`, start: `${y}-12-25`, end: `${y}-12-31` },
      ];

      const active = promos.find((p) => new Date(p.start) <= now && now <= new Date(p.end));
      const label = active ? active.name + ": " : "";
      h.textContent = isFallback || !offer ? FALLBACK_MESSAGE : `${label}${offer}`;
    }

    async function loadOffer(c, v, retries = 0) {
      try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        const rows = text.split("\n").map((r) => r.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()));
        const lookupKey = normalize(c + v);
        const match = rows.find((r) => normalize(r[6]) === lookupKey);
        const offer = match ? match[2] : FALLBACK_MESSAGE;
        const color = match ? match[3] || "#f93536" : "#f93536";
        const customPromo = match && match[7] ? match[7] : "";
        renderHeader(v, offer, color, AUTHOR, customPromo);
      } catch (e) {
        if (retries < 3) {
          console.warn("Retrying fetch...", e.message);
          setTimeout(() => loadOffer(c, v, retries + 1), 1000);
        } else {
          showError("⚠️ Offer fetch failed");
          renderHeader(v, FALLBACK_MESSAGE, "#f93536", AUTHOR, "", true);
        }
      }
    }

    function waitForHeader() {
      const el = document.getElementById("promo-header");
      if (el) loadOffer(CLIENT_NAME, VERTICAL);
      else setTimeout(waitForHeader, 400);
    }

    waitForHeader();
  })();
} catch (err) {
  console.error("⚠️ Script crashed:", err.message);
  const el = document.getElementById("promo-header");
  if (el) el.textContent = "⚠️ Script initialization error";
}


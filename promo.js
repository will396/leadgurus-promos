/* 🏠 Lead Gurus - Cloudflare Worker Edition v2.0
   - Fetches live offers via your Cloudflare proxy
   - Fully Leadshook-compatible (no CORS or sandbox issues)
   - Uses LookupKey column for matching
   - Auto seasonal labeling
*/

(function () {
  const CLIENT_NAME = document.currentScript.getAttribute("data-client");
  const VERTICAL = document.currentScript.getAttribute("data-vertical");
  const AUTHOR = "Lead Gurus";
  const FALLBACK_MESSAGE = "💰 Save Thousands for a Limited Time";

  // ✅ Your Cloudflare Worker URL (this fetches the JSON from Google Sheets)
  const jsonUrl = "https://black-snow-0bd8.will-070.workers.dev/";

  const normalize = (str) =>
    str?.toString()
      .normalize("NFD")
      .replace(/[\u00A0]/g, " ")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

  const showError = (msg) => {
    const el = document.getElementById("promo-header");
    if (el) el.textContent = msg;
    console.warn(msg);
  };

  function renderHeader(v, offer, color, author, customPromo = "", isFallback = false) {
    const h = document.getElementById("promo-header");
    if (!h) return showError("❌ promo-header not found");

    const now = new Date();
    const y = now.getFullYear();
    const promos = [
      { name: `🎉 New Year ${v} Refresh`, start: `${y}-01-01`, end: `${y}-01-07` },
      { name: `❄️ Winter ${v} Upgrade`, start: `${y}-01-08`, end: `${y}-01-31` },
      { name: `💘 Sweetheart ${v} Sale`, start: `${y}-02-01`, end: `${y}-02-13` },
      { name: `💝 Valentine’s ${v} Sale`, start: `${y}-02-14`, end: `${y}-02-20` },
      { name: `🇺🇸 Presidents’ Day ${v} Sale`, start: `${y}-02-21`, end: `${y}-02-29` },
      { name: `🌸 Spring ${v} Refresh`, start: `${y}-03-01`, end: `${y}-03-31` },
      { name: `☀️ Summer ${v} Sale`, start: `${y}-06-01`, end: `${y}-06-30` },
      { name: `🎆 Independence ${v} Sale`, start: `${y}-07-01`, end: `${y}-07-07` },
      { name: `🍁 Fall ${v} Sale`, start: `${y}-09-01`, end: `${y}-09-30` },
      { name: `🎃 Halloween ${v} Sale`, start: `${y}-10-16`, end: `${y}-10-31` },
      { name: `🛍️ Early Black Friday Sale`, start: `${y}-11-01`, end: `${y}-11-24` },
      { name: `🖤 Black Friday Sale`, start: `${y}-11-25`, end: `${y}-11-30` },
      { name: `🎄 Holiday Savings Sale`, start: `${y}-12-01`, end: `${y}-12-15` },
      { name: `🎆 Year-End Sale`, start: `${y}-12-25`, end: `${y}-12-31` },
    ];

    let active = promos.find((p) => new Date(p.start) <= now && now <= new Date(p.end));
    if (!active) active = promos[promos.length - 1];

    Object.assign(h.style, {
      backgroundColor: color,
      color: "#fff",
      textAlign: "center",
      fontSize: "18px",
      fontWeight: "bold",
      padding: "10px 8px",
      lineHeight: "1.3",
      overflowWrap: "break-word",
      whiteSpace: "normal",
    });

    const label = customPromo ? customPromo + ": " : active.name + ": ";
    h.textContent =
      isFallback || !offer ? FALLBACK_MESSAGE : `${label}${offer}`;
  }

  async function loadOffer(c, v, retries = 0) {
    try {
      const res = await fetch(jsonUrl);
      const text = await res.text();
      const json = JSON.parse(text.substring(47, text.length - 2)); // Google visualization JSON cleanup
      const rows = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : "")));

      const lookupKey = normalize(c + v);
      const m = rows.find((r) => normalize(r[6]) === lookupKey);

      const offer = m ? m[2] : FALLBACK_MESSAGE,
        color = m ? m[3] || "#f93536" : "#f93536",
        author = m ? m[4] || AUTHOR : AUTHOR,
        customPromo = m && m[7] ? m[7] : "";

      renderHeader(v, offer, color, author, customPromo);
    } catch (e) {
      if (retries < 3) {
        console.warn(`Retrying fetch... (${retries + 1})`);
        setTimeout(() => loadOffer(c, v, retries + 1), 1000);
      } else {
        showError(`⚠️ Offer load failed: ${e.message}`);
        renderHeader(VERTICAL, FALLBACK_MESSAGE, "#f93536", AUTHOR, "", true);
      }
    }
  }

  function waitUntilReady() {
    const headerEl = document.getElementById("promo-header");
    if (headerEl) loadOffer(CLIENT_NAME, VERTICAL);
    else setTimeout(waitUntilReady, 400);
  }

  waitUntilReady();
})();

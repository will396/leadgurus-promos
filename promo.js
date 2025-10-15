/* 🏠 Lead Gurus - Global Promo Script (Rollout-Safe v1.2)
   - Reads from Offers-New tab during transition
   - Uses LookupKey column for reliable matching
   - Works for all clients & verticals automatically
   - Auto seasonal labeling
   - DOM-safe (fixes 'Loading Offer' on mobile)
*/

document.addEventListener("DOMContentLoaded", () => {

  const s = document.currentScript;
  const CLIENT_NAME = s.getAttribute("data-client");
  const VERTICAL = s.getAttribute("data-vertical");
  const AUTHOR = "Lead Gurus";
  const SHEET_ID = "1rwgtCjN_wXnJs77dF-djv-72kAHyXiI072ffXIZ8uSk";
  const API_KEY = "AIzaSyCKH_5CVN47E_tE-flYHDDyKLPVGtjNEGQ";
  const FALLBACK_MESSAGE = "💰 Save Thousands for a Limited Time";

  // 🔧 Normalize text for case & spacing
  function normalize(str) {
    return str?.toString()
      .normalize("NFD")
      .replace(/[\u00A0]/g, " ")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();
  }

  // 🧠 Fetch offer from Offers-New tab
  async function loadOffer(c, v) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'Offers-New'!A2:H500?key=${API_KEY}&t=${Date.now()}`
      );
      const d = await res.json();
      if (!d.values) throw new Error("No data returned");

      const rows = d.values;
      const lookupKey = normalize(c + v);

      // ✅ Match by LookupKey column (G = index 6)
      const m = rows.find(r => normalize(r[6]) === lookupKey);

      const offer = m ? m[2] : FALLBACK_MESSAGE,
            color = m ? m[3] || "#f93536" : "#f93536",
            author = m ? m[4] || AUTHOR : AUTHOR,
            customPromo = m && m[7] ? m[7] : ""; // Optional custom promo override (column H)

      renderHeader(v, offer, color, author, customPromo);
    } catch (e) {
      console.warn("Sheet error → fallback:", e);
      renderHeader(VERTICAL, FALLBACK_MESSAGE, "#f93536", AUTHOR, "", true);
    }
  }

  // 🖼️ Display the promo banner
  function renderHeader(v, offer, color, author, customPromo = "", isFallback = false) {
    const now = new Date();
    const y = now.getFullYear();
    const promos = getPromos(y, v);

    // ✅ Choose current or most recent promo
    let active = promos.find(p => new Date(p.start) <= now && now <= new Date(p.end));
    if (!active) {
      active = promos.findLast
        ? promos.findLast(p => new Date(p.start) < now)
        : promos[promos.length - 1];
    }

    const h = document.getElementById("promo-header");
    if (!h) return;

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

    const label = customPromo
      ? customPromo + ": "
      : active && active.name
        ? active.name + ": "
        : "";

    h.textContent =
      isFallback || offer === FALLBACK_MESSAGE
        ? FALLBACK_MESSAGE
        : `${label}${offer}`;
  }

  // 🎉 Universal seasonal promos (auto-applies to all verticals)
  function getPromos(y, v) {
    return [
      { name: `🎉 New Year ${v} Refresh`, start: `${y}-01-01`, end: `${y}-01-07` },
      { name: `❄️ Winter ${v} Upgrade`, start: `${y}-01-08`, end: `${y}-01-31` },
      { name: `💘 Sweetheart ${v} Sale`, start: `${y}-02-01`, end: `${y}-02-13` },
      { name: `💝 Valentine’s ${v} Sale`, start: `${y}-02-14`, end: `${y}-02-20` },
      { name: `🇺🇸 Presidents’ Day ${v} Sale`, start: `${y}-02-21`, end: `${y}-02-29` },
      { name: `🌸 Spring ${v} Refresh`, start: `${y}-03-01`, end: `${y}-03-31` },
      { name: `🌧️ April ${v} Savings`, start: `${y}-04-01`, end: `${y}-04-30` },
      { name: `💐 Mother’s Day ${v} Sale`, start: `${y}-05-01`, end: `${y}-05-11` },
      { name: `☀️ Summer ${v} Sale`, start: `${y}-06-01`, end: `${y}-06-30` },
      { name: `🎆 Independence ${v} Sale`, start: `${y}-07-01`, end: `${y}-07-07` },
      { name: `☀️ Mid-Summer ${v} Refresh`, start: `${y}-07-08`, end: `${y}-07-31` },
      { name: `🌅 End-of-Summer ${v} Sale`, start: `${y}-08-01`, end: `${y}-08-31` },
      { name: `🍁 Fall ${v} Sale`, start: `${y}-09-01`, end: `${y}-09-30` },
      { name: `🍂 Autumn ${v} Sale`, start: `${y}-10-01`, end: `${y}-10-15` },
      { name: `🎃 Halloween ${v} Sale`, start: `${y}-10-16`, end: `${y}-10-31` },
      { name: "🛍️ Early Black Friday Sale", start: `${y}-11-01`, end: `${y}-11-24` },
      { name: "🖤 Black Friday Sale", start: `${y}-11-25`, end: `${y}-11-30` },
      { name: "🎄 Holiday Savings Sale", start: `${y}-12-01`, end: `${y}-12-15` },
      { name: "🎅 Christmas Sale", start: `${y}-12-16`, end: `${y}-12-24` },
      { name: "🎆 Year-End Sale", start: `${y}-12-25`, end: `${y}-12-31` },
    ];
  }

  // 🚀 Launch
  loadOffer(CLIENT_NAME, VERTICAL);

});

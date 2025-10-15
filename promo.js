/* 🏠 Lead Gurus - Leadshook-Proof Script v1.6
   - Reads from published CSV feed (no API key)
   - Waits for DOM & retries until loaded
   - Works inside Leadshook’s delayed iframe renderer
*/

(function () {
  const CLIENT_NAME = document.currentScript.getAttribute("data-client");
  const VERTICAL = document.currentScript.getAttribute("data-vertical");
  const AUTHOR = "Lead Gurus";
  const FALLBACK_MESSAGE = "💰 Save Thousands for a Limited Time";

  // ✅ Your published CSV feed
  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQi0b-DlbldAqnDEQ8KGSN_FW2NujnC43ePOHCfFuLCkKc0TKlJ9vHVZkRlZ676QOASvsW8ZnFBvkI3/pub?gid=1583681302&single=true&output=csv";

  // --- Helpers --------------------------------------------------------------
  const normalize = (str) =>
    str?.toString()
      .normalize("NFD")
      .replace(/[\u00A0]/g, " ")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

  function showError(msg) {
    const el = document.getElementById("promo-header");
    if (el) el.textContent = msg;
    console.warn(msg);
  }

  // --- Header rendering -----------------------------------------------------
  function renderHeader(v, offer, color, author, customPromo = "", isFallback = false) {
    const h = document.getElementById("promo-header");
    if (!h) return showError("❌ promo-header element not found");

    const now = new Date();
    const y = now.getFullYear();
    const promos = getPromos(y, v);
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

    const label = customPromo
      ? customPromo + ": "
      : active && active.name
      ? active.name + ": "
      : "";

    h.textContent =
      isFallback || !offer ? FALLBACK_MESSAGE : `${label}${offer}`;
  }

  // --- Seasonal promo builder ----------------------------------------------
  function getPromos(y, v) {
    return [
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
  }

  // --- Offer loader ---------------------------------------------------------
  async function loadOffer(c, v, retries = 0) {
    try {
      const res = await fetch(csvUrl);
      const text = await res.text();
      const rows = text.split("\n").map((r) =>
        r.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim())
      );

      const lookupKey = normalize(c + v);
      const dataRows = rows.slice(1);
      const m = dataRows.find((r) => normalize(r[6]) === lookupKey);

      const offer = m ? m[2] : FALLBACK_MESSAGE,
        color = m ? m[3] || "#f93536" : "#f93536",
        author = m ? m[4] || AUTHOR : AUTHOR,
        customPromo = m && m[7] ? m[7] : "";

      renderHeader(v, offer, color, author, customPromo);
    } catch (e) {
      if (retries < 5) {
        console.warn(`Retrying fetch... (${retries + 1})`);
        setTimeout(() => loadOffer(c, v, retries + 1), 800);
      } else {
        showError(`⚠️ Offer fetch failed: ${e.message}`);
        renderHeader(VERTICAL, FALLBACK_MESSAGE, "#f93536", AUTHOR, "", true);
      }
    }
  }

  // --- Wait for Leadshook DOM ----------------------------------------------
  function waitUntilReady() {
    const headerEl = document.getElementById("promo-header");
    if (headerEl) {
      console.log("✅ promo-header found, loading offer...");
      loadOffer(CLIENT_NAME, VERTICAL);
    } else {
      console.log("⏳ Waiting for Leadshook to render...");
      setTimeout(waitUntilReady, 500);
    }
  }

  // Start checking once Leadshook finishes rendering
  let retryCount = 0;
  (function waitForLeadshook() {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      waitUntilReady();
    } else if (retryCount < 20) {
      retryCount++;
      setTimeout(waitForLeadshook, 500);
    } else {
      console.warn(
        "⚠️ Leadshook DOM never fully loaded — using fallback offer"
      );
      renderHeader(VERTICAL, FALLBACK_MESSAGE, "#f93536", AUTHOR, "", true);
    }
  })();
})();

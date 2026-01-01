/* ==========================================================================
ARC-方舟｜app.js
- 目的：提供全站通用工具（資料載入、DOM helpers、querystring、escape）
- 使用：在頁面底部引入，例如：
<script src="assets/js/app.js"></script>
<script src="assets/js/main.js"></script>
========================================================================== */

(function (global) {
"use strict";

const ARC = {};

/* -----------------------------
1) Utilities
----------------------------- */

ARC.$ = function (sel, root) {
return (root || document).querySelector(sel);
};

ARC.$$ = function (sel, root) {
return Array.from((root || document).querySelectorAll(sel));
};

ARC.normalize = function (s) {
return (s || "").toString().toLowerCase().trim();
};

ARC.escapeHtml = function (s) {
return (s || "").toString()
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
};

ARC.setText = function (id, text) {
const el = document.getElementById(id);
if (!el) return false;
if (typeof text === "string" && text.trim()) {
el.textContent = text.trim();
return true;
}
return false;
};

ARC.setHref = function (id, href) {
const el = document.getElementById(id);
if (!el) return false;
if (typeof href === "string" && href.trim()) {
el.href = href.trim();
return true;
}
return false;
};

ARC.setSrc = function (id, src) {
const el = document.getElementById(id);
if (!el) return false;
if (typeof src === "string" && src.trim()) {
el.src = src.trim();
return true;
}
return false;
};

ARC.qs = function () {
return new URLSearchParams(global.location.search);
};

ARC.getParam = function (key, fallback) {
const v = ARC.qs().get(key);
return v === null ? fallback : v;
};

/* -----------------------------
2) Fetch helpers
----------------------------- */

// Fetch JSON with no-store to avoid caching issues on GitHub Pages updates
ARC.fetchJSON = async function (url) {
const res = await fetch(url, { cache: "no-store" });
if (!res.ok) {
const err = new Error("FETCH_JSON_FAILED");
err.status = res.status;
err.url = url;
throw err;
}
return await res.json();
};

ARC.safeFetchJSON = async function (url, fallbackValue) {
try {
return await ARC.fetchJSON(url);
} catch {
return fallbackValue;
}
};

/* -----------------------------
3) Site bootstrap (optional)
- Populate common header texts if ids exist on page
----------------------------- */
ARC.applySite = function (site) {
if (!site) return;

// Common ids used across pages
if (site.title) {
// If page wants custom title composition, it can override after this runs.
ARC.setText("siteTitle", site.title);
}
if (site.tagline) ARC.setText("siteTagline", site.tagline);

if (site.heroTitle) ARC.setText("heroTitle", site.heroTitle);
if (site.heroDesc) ARC.setText("heroDesc", site.heroDesc);

if (site.inviteUrl) {
ARC.setText("inviteLink", site.inviteUrl);
ARC.setHref("inviteBtn", site.inviteUrl);
ARC.setHref("inviteTag", site.inviteUrl);
}

if (site.inviteQr) ARC.setSrc("inviteQr", site.inviteQr);

// Brand images (if present)
if (site.brand && site.brand.logo) {
// If you later standardize an id like brandLogo, you can wire it here.
// ARC.setSrc("brandLogo", site.brand.logo);
}
};

ARC.bootstrap = async function (siteJsonPath) {
// Auto set year if element exists
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();

const site = await ARC.safeFetchJSON(siteJsonPath || "./data/site.json", null);
ARC.applySite(site);
return site;
};

/* -----------------------------
4) Clipboard helper
----------------------------- */
ARC.copyText = async function (text) {
try {
await navigator.clipboard.writeText(text);
return true;
} catch {
// Fallback for older browsers
try {
const tmp = document.createElement("input");
tmp.value = text;
document.body.appendChild(tmp);
tmp.select();
document.execCommand("copy");
document.body.removeChild(tmp);
return true;
} catch {
return false;
}
}
};

/* -----------------------------
5) Export
----------------------------- */
global.ARC = ARC;
})(window);

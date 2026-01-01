/* ==========================================================================
ARC-方舟｜fetch.js
- 目的：資料載入層（JSON/文本）、快取策略、錯誤處理、基礎資料整形
- 依賴：無（可選配 app.js 的 window.ARC）
- 使用：
const data = await ARC_FETCH.json("./data/site.json");
const safe = await ARC_FETCH.safeJson("./data/team.json", { members: [] });
========================================================================== */

(function (global) {
"use strict";

const F = {};

// Default fetch options: avoid stale cache on GitHub Pages deploy updates.
const NO_STORE = { cache: "no-store" };

function makeError(code, info) {
const e = new Error(code);
if (info && typeof info === "object") Object.assign(e, info);
return e;
}

async function request(url, options) {
const res = await fetch(url, options || NO_STORE);
if (!res.ok) {
throw makeError("FETCH_FAILED", { url, status: res.status, statusText: res.statusText });
}
return res;
}

/* -----------------------------
1) Fetchers
----------------------------- */

F.json = async function (url, options) {
const res = await request(url, options || NO_STORE);
try {
return await res.json();
} catch {
throw makeError("JSON_PARSE_FAILED", { url });
}
};

F.text = async function (url, options) {
const res = await request(url, options || NO_STORE);
return await res.text();
};

F.safeJson = async function (url, fallbackValue, options) {
try {
return await F.json(url, options);
} catch {
return fallbackValue;
}
};

F.safeText = async function (url, fallbackValue, options) {
try {
return await F.text(url, options);
} catch {
return fallbackValue;
}
};

/* -----------------------------
2) Normalizers
- 支援 {members:[...]} / array
- 支援 {articles:[...]} / array
----------------------------- */

F.teamMembers = function (data) {
if (Array.isArray(data)) return data;
if (data && Array.isArray(data.members)) return data.members;
return [];
};

F.articleList = function (data) {
if (Array.isArray(data)) return data;
if (data && Array.isArray(data.articles)) return data.articles;
return [];
};

/* -----------------------------
3) Batch helpers
----------------------------- */

// Load site.json + (optional) extra JSONs in parallel
// Example:
// const { site, team } = await ARC_FETCH.loadBundle({
// site: "./data/site.json",
// team: "./data/team.json"
// });
F.loadBundle = async function (map) {
const entries = Object.entries(map || {});
const tasks = entries.map(async ([key, url]) => {
const data = await F.json(url);
return [key, data];
});

const out = {};
const done = await Promise.all(tasks);
done.forEach(([k, v]) => (out[k] = v));
return out;
};

/* -----------------------------
4) Export
----------------------------- */
global.ARC_FETCH = F;
})(window);

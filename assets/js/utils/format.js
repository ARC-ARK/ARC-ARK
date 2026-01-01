/* ==========================================================================
ARC-方舟｜format.js
- 目的：格式化工具（日期、人名/職務顯示、標籤整理、內容轉換）
- 依賴：無（可選配 app.js 的 window.ARC）
- 使用：
ARC_FMT.date("2026-01-01") -> "2026/01/01"
ARC_FMT.tags(["新手","入門"], 2) -> ["新手","入門"]
========================================================================== */

(function (global) {
"use strict";

const FMT = {};

/* -----------------------------
1) Strings
----------------------------- */
FMT.trim = function (s) {
return (s || "").toString().trim();
};

FMT.normalize = function (s) {
return (s || "").toString().toLowerCase().trim();
};

FMT.ellipsis = function (s, max) {
const t = (s || "").toString();
const m = Number.isFinite(max) ? max : 120;
if (t.length <= m) return t;
return t.slice(0, Math.max(0, m - 1)) + "…";
};

/* -----------------------------
2) Date / time
- Input expected: "YYYY-MM-DD" or ISO
----------------------------- */
FMT.date = function (input, locale) {
const v = FMT.trim(input);
if (!v) return "";
// Try parse
const d = new Date(v);
if (Number.isNaN(d.getTime())) return v;

const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");

// Default: zh-Hant readable (slash)
if (locale === "dash") return `${yyyy}-${mm}-${dd}`;
return `${yyyy}/${mm}/${dd}`;
};

FMT.year = function () {
return new Date().getFullYear();
};

/* -----------------------------
3) Tags
----------------------------- */
FMT.tags = function (tags, limit) {
const list = Array.isArray(tags) ? tags.filter(Boolean) : [];
const uniq = [];
const seen = new Set();

list.forEach(t => {
const key = FMT.trim(t);
if (!key) return;
if (seen.has(key)) return;
seen.add(key);
uniq.push(key);
});

const n = Number.isFinite(limit) ? limit : uniq.length;
return uniq.slice(0, Math.max(0, n));
};

FMT.collectTags = function (articles) {
const set = new Set();
(Array.isArray(articles) ? articles : []).forEach(a => {
(Array.isArray(a && a.tags) ? a.tags : []).forEach(t => {
const key = FMT.trim(t);
if (key) set.add(key);
});
});
return Array.from(set);
};

/* -----------------------------
4) People display helpers
----------------------------- */
FMT.personLine = function (name, role) {
const n = FMT.trim(name);
const r = FMT.trim(role);
if (n && r) return `${n}｜${r}`;
return n || r || "";
};

/* -----------------------------
5) Content shaping
- For article.json blocks:
[{type:"p", text:"..."}, {type:"ul", items:[...]}...]
----------------------------- */
FMT.blocksToHTML = function (blocks) {
const escape = (s) =>
(s || "").toString()
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");

if (Array.isArray(blocks)) {
return blocks.map(b => {
const type = (b.type || "p").toLowerCase();
if (type === "h3") return `<h3>${escape(b.text || "")}</h3>`;
if (type === "blockquote") return `<blockquote>${escape(b.text || "")}</blockquote>`;
if (type === "ul") {
const items = Array.isArray(b.items) ? b.items : [];
return `<ul>${items.map(i => `<li>${escape(i)}</li>`).join("")}</ul>`;
}
// default paragraph
return `<p>${escape(b.text || "")}</p>`;
}).join("");
}

if (typeof blocks === "string") {
return `<p>${escape(blocks)}</p>`;
}

return "";
};

/* -----------------------------
6) Export
----------------------------- */
global.ARC_FMT = FMT;
})(window);

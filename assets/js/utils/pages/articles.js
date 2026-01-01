/* ==========================================================================
ARC-方舟｜pages/articles.js
- 目的：articles.html 的頁面邏輯（載入 articles.json、渲染、搜尋、標籤篩選）
- 依賴：
- assets/js/fetch.js (window.ARC_FETCH)
- assets/js/dom.js (window.ARC_DOM) [可選：若缺則用內建簡易渲染]
- assets/js/format.js (window.ARC_FMT) [可選]
- HTML 需求（articles.html 內對應 id）：
#list 文章卡片容器
#empty 空狀態容器（可選）
#search 搜尋輸入框（可選）
#chips 標籤 chips 容器（可選）
#countHint 顯示篇數（可選）
========================================================================== */

(function () {
"use strict";

const FETCH = window.ARC_FETCH;
const DOM = window.ARC_DOM;
const FMT = window.ARC_FMT;

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const chipsEl = document.getElementById("chips");
const hintEl = document.getElementById("countHint");

const normalize = (s) => (FMT && FMT.normalize ? FMT.normalize(s) : (s || "").toString().toLowerCase().trim());
const safeTags = (tags, limit) => (FMT && FMT.tags ? FMT.tags(tags, limit) : (Array.isArray(tags) ? tags.slice(0, limit || tags.length) : []));
const collectTags = (articles) => (FMT && FMT.collectTags ? FMT.collectTags(articles) : Array.from(new Set((articles || []).flatMap(a => Array.isArray(a.tags) ? a.tags : []))));

let original = [];
let activeTag = "全部";

function setHint(text) {
if (hintEl) hintEl.textContent = text;
}

function showEmpty(show) {
if (!emptyEl) return;
emptyEl.style.display = show ? "block" : "none";
}

function clearList() {
if (!listEl) return;
while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
}

function renderList(list) {
if (!listEl) return;

clearList();

if (!list || !list.length) {
showEmpty(true);
setHint("0 篇");
return;
}

showEmpty(false);
setHint(`${list.length} 篇`);

const frag = document.createDocumentFragment();

list.forEach((a) => {
if (DOM && typeof DOM.articleCard === "function") {
frag.appendChild(DOM.articleCard(a));
return;
}

// Fallback minimal card (if dom.js not loaded)
const card = document.createElement("article");
card.className = "card";

const id = (a && a.id) || "";
const title = (a && a.title) || "未命名文章";
const excerpt = (a && a.excerpt) || "（尚未填寫摘要）";
const cover = (a && a.cover) || "../assets/img/articles/a-0001-cover.jpg";
const date = (a && a.date) || "";
const tags = Array.isArray(a && a.tags) ? a.tags : [];

card.innerHTML = `
<div style="display:flex; gap:14px;">
<div style="width:160px; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.06);">
<img src="${cover}" alt="${title}" style="width:100%; height:100%; object-fit:cover; opacity:.92;"
onerror="this.style.opacity='.35';" />
</div>
<div style="flex:1; min-width:0;">
<div style="font-weight:850; font-size:16px; line-height:1.25;">${title}</div>
<div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; color:rgba(255,255,255,.62); font-size:12.5px;">
${date ? `<span class="pill">${date}</span>` : ``}
${tags.slice(0,2).map(t=>`<span class="pill pill-accent">${t}</span>`).join("")}
</div>
<div style="margin-top:8px; color:rgba(255,255,255,.60); line-height:1.65; font-size:13.5px;">
${excerpt}
</div>
<div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
<a class="btn" href="./article.html?id=${encodeURIComponent(id)}" style="padding:8px 10px;">閱讀全文</a>
<span class="hint">ID：<span class="mono">${id || "N/A"}</span></span>
</div>
</div>
</div>
`;

frag.appendChild(card);
});

listEl.appendChild(frag);
}

function buildChips(allTags) {
if (!chipsEl) return;

chipsEl.innerHTML = "";

const tags = ["全部", ...allTags];
tags.forEach((t) => {
const el = document.createElement("div");
el.className = "chip" + (t === activeTag ? " active" : "");
el.textContent = t;

el.addEventListener("click", () => {
activeTag = t;
// update active state
Array.from(chipsEl.children).forEach(c => c.classList.remove("active"));
el.classList.add("active");
applyFilter();
});

chipsEl.appendChild(el);
});
}

function matchArticle(a, q) {
const hay = [
a && a.title,
a && a.excerpt,
...(Array.isArray(a && a.tags) ? a.tags : [])
].map(normalize).join(" ");
return hay.includes(q);
}

function applyFilter() {
const q = normalize(searchEl ? searchEl.value : "");

let filtered = original;

if (activeTag && activeTag !== "全部") {
filtered = filtered.filter(a => (Array.isArray(a && a.tags) ? a.tags : []).includes(activeTag));
}

if (q) filtered = filtered.filter(a => matchArticle(a, q));

renderList(filtered);
}

async function init() {
if (!listEl) return;

if (!FETCH) {
showEmpty(true);
setHint("載入失敗（缺少 fetch.js）");
return;
}

setHint("載入中…");

const raw = await FETCH.safeJson("../data/articles.json", { articles: [] });
original = FETCH.articleList(raw);

// Build tag chips
const tags = collectTags(original)
.map(t => (t || "").toString().trim())
.filter(Boolean)
.sort((a, b) => a.localeCompare(b, "zh-Hant"));
buildChips(tags);

// Initial render
renderList(original);

// Search
if (searchEl) {
searchEl.addEventListener("input", applyFilter);
}
}

init();
})();

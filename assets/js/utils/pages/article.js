/* ==========================================================================
ARC-方舟｜pages/article.js
- 目的：article.html 的頁面邏輯（依 id 讀取文章索引 + 文章全文 JSON）
- 依賴：
- assets/js/fetch.js (window.ARC_FETCH)
- assets/js/format.js (window.ARC_FMT) [可選：轉換 blocks -> HTML]
- assets/js/app.js (window.ARC) [可選：copyText / escape]
- HTML 需求（article.html 內對應 id）：
#title 標題
#excerpt 摘要（可選）
#content 內容區（HTML）
#meta meta pills 容器（可選）
#coverImg 封面 img（可選）
#error 錯誤訊息（可選）
#copyLink 複製連結按鈕（可選）
- 資料路徑約定：
../data/articles.json
../content/articles/{id}.json
========================================================================== */

(function () {
"use strict";

const FETCH = window.ARC_FETCH;
const FMT = window.ARC_FMT;
const ARC = window.ARC;

const titleEl = document.getElementById("title");
const excerptEl = document.getElementById("excerpt");
const contentEl = document.getElementById("content");
const metaEl = document.getElementById("meta");
const coverEl = document.getElementById("coverImg");
const errorEl = document.getElementById("error");
const copyBtn = document.getElementById("copyLink");

const qs = new URLSearchParams(location.search);
const id = qs.get("id");

const escapeHtml = (s) => (ARC && ARC.escapeHtml ? ARC.escapeHtml(s) : (s || "").toString()
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;"));

function setError(msgHtml) {
if (!errorEl) return;
errorEl.style.display = "block";
errorEl.innerHTML = msgHtml;
}

function renderMeta(a) {
if (!metaEl) return;

const pills = [];

if (a.date) pills.push(`<span class="pill">${escapeHtml(a.date)}</span>`);
if (a.author) pills.push(`<span class="pill">${escapeHtml(a.author)}</span>`);

if (Array.isArray(a.tags)) {
a.tags.slice(0, 6).forEach(t => {
pills.push(`<span class="pill pill-accent">${escapeHtml(t)}</span>`);
});
}

metaEl.innerHTML = pills.join("");
}

function renderContent(a) {
if (!contentEl) return;

// Prefer format.js blocksToHTML
if (FMT && typeof FMT.blocksToHTML === "function") {
contentEl.innerHTML = FMT.blocksToHTML(a.content);
return;
}

// Fallback minimal renderer
if (Array.isArray(a.content)) {
contentEl.innerHTML = a.content.map(b => {
const type = (b.type || "p").toLowerCase();
if (type === "h3") return `<h3>${escapeHtml(b.text || "")}</h3>`;
if (type === "blockquote") return `<blockquote>${escapeHtml(b.text || "")}</blockquote>`;
if (type === "ul") {
const items = Array.isArray(b.items) ? b.items : [];
return `<ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}
return `<p>${escapeHtml(b.text || "")}</p>`;
}).join("");
return;
}

if (typeof a.content === "string") {
contentEl.innerHTML = `<p>${escapeHtml(a.content)}</p>`;
return;
}

contentEl.innerHTML = "";
}

async function init() {
if (!FETCH) {
if (titleEl) titleEl.textContent = "載入失敗";
setError("缺少 <span class='mono'>fetch.js</span>，請確認已在頁面引入。");
return;
}

if (!id) {
if (titleEl) titleEl.textContent = "找不到文章 ID";
setError(`未提供文章 ID。請從 <a class="btn" href="./articles.html" style="display:inline-flex; padding:6px 10px; margin-top:8px;">文章列表</a> 進入。`);
return;
}

// 1) load index
const indexRaw = await FETCH.safeJson("../data/articles.json", { articles: [] });
const list = FETCH.articleList(indexRaw);
const meta = list.find(a => a.id === id) || null;

if (!meta) {
if (titleEl) titleEl.textContent = "找不到文章";
setError(`找不到文章索引：<span class="mono">${escapeHtml(id)}</span><br/>
請確認 <span class="mono">/data/articles.json</span> 內包含此文章 ID。`);
return;
}

// apply meta first
if (titleEl) titleEl.textContent = meta.title || "未命名文章";
document.title = `${meta.title || "文章"}｜ARC-方舟`;
if (excerptEl) excerptEl.textContent = meta.excerpt || "";
if (coverEl && meta.cover) coverEl.src = meta.cover;
renderMeta(meta);

// 2) load full article json
const fullUrl = `../content/articles/${encodeURIComponent(id)}.json`;
const full = await FETCH.safeJson(fullUrl, null);

if (!full) {
setError(`已找到文章索引，但找不到全文檔案：<span class="mono">${escapeHtml(fullUrl)}</span><br/>
請新增對應的全文 JSON（例如：<span class="mono">${escapeHtml(id)}.json</span>）。`);
return;
}

// merge
const article = Object.assign({}, meta, full);

if (article.title && titleEl) titleEl.textContent = article.title;
if (article.excerpt && excerptEl) excerptEl.textContent = article.excerpt;
if (article.cover && coverEl) coverEl.src = article.cover;

renderMeta(article);
renderContent(article);
}

// Copy link
if (copyBtn) {
copyBtn.addEventListener("click", async (e) => {
e.preventDefault();
const ok = ARC && typeof ARC.copyText === "function"
? await ARC.copyText(location.href)
: (async () => {
try { await navigator.clipboard.writeText(location.href); return true; }
catch { return false; }
})();

const old = copyBtn.textContent;
copyBtn.textContent = ok ? "已複製" : "複製失敗";
setTimeout(() => (copyBtn.textContent = old || "複製本文連結"), 1200);
});
}

init();
})();

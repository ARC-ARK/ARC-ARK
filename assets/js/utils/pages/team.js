/* ==========================================================================
ARC-方舟｜pages/team.js
- 目的：team.html 的頁面邏輯（載入 team.json、渲染、搜尋）
- 依賴：
- assets/js/fetch.js (window.ARC_FETCH)
- assets/js/dom.js (window.ARC_DOM) [可選：若缺則用內建簡易渲染]
- assets/js/format.js (window.ARC_FMT) [可選]
- HTML 需求（team.html 內對應 id）：
#teamGrid 團隊卡片容器
#empty 空狀態容器（可選）
#search 搜尋輸入框（可選）
#countHint 顯示人數（可選）
========================================================================== */

(function () {
"use strict";

const FETCH = window.ARC_FETCH;
const DOM = window.ARC_DOM;
const FMT = window.ARC_FMT;

const grid = document.getElementById("teamGrid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const hint = document.getElementById("countHint");

const normalize = (s) => (FMT && FMT.normalize ? FMT.normalize(s) : (s || "").toString().toLowerCase().trim());

function setHint(text) {
if (hint) hint.textContent = text;
}

function showEmpty(show) {
if (!empty) return;
empty.style.display = show ? "block" : "none";
}

function clearGrid() {
if (!grid) return;
while (grid.firstChild) grid.removeChild(grid.firstChild);
}

function renderList(list) {
if (!grid) return;

clearGrid();

if (!list || !list.length) {
showEmpty(true);
setHint("0 位成員");
return;
}

showEmpty(false);
setHint(`${list.length} 位成員`);

const frag = document.createDocumentFragment();

list.forEach((m) => {
if (DOM && typeof DOM.teamCard === "function") {
frag.appendChild(DOM.teamCard(m));
return;
}

// Fallback minimal card (if dom.js not loaded)
const card = document.createElement("article");
card.className = "member";

const name = (m && m.name) || "未命名";
const role = (m && m.role) || "—";
const bio = (m && m.bio) || "（尚未填寫簡介）";
const avatar = (m && m.avatar) || "../assets/img/team/gm.png";
const tags = Array.isArray(m && m.tags) ? m.tags : [];
const links = Array.isArray(m && m.links) ? m.links : [];

card.innerHTML = `
<div class="member-top">
<div class="avatar">
<img src="${avatar}" alt="${name}" onerror="this.src='../assets/img/team/gm.png';" />
</div>
<div class="meta">
<div class="name">${name}</div>
<div class="role">
<span>${role}</span>
${tags.slice(0,3).map((t,i)=>`<span class="${i%2===0?'pill':'pill alt'}">${t}</span>`).join("")}
</div>
</div>
</div>
<div class="bio">${bio}</div>
<div class="links">
${links.slice(0,3).map(l=>{
const label = (l && l.label) || "連結";
const url = (l && l.url) || "#";
const ext = url.startsWith("http");
return `<a class="link" href="${url}" ${ext ? 'target="_blank" rel="noopener"' : ""}>${label}</a>`;
}).join("")}
</div>
`;

frag.appendChild(card);
});

grid.appendChild(frag);
}

function matchMember(m, q) {
const hay = [
m && m.name,
m && m.role,
m && m.bio,
...(Array.isArray(m && m.tags) ? m.tags : [])
].map(normalize).join(" ");
return hay.includes(q);
}

async function init() {
if (!grid) return;

if (!FETCH) {
showEmpty(true);
setHint("載入失敗（缺少 fetch.js）");
return;
}

setHint("載入中…");

const raw = await FETCH.safeJson("../data/team.json", { members: [] });
const members = FETCH.teamMembers(raw);

// Default render
renderList(members);

// Search
if (search) {
search.addEventListener("input", () => {
const q = normalize(search.value);
if (!q) return renderList(members);
renderList(members.filter((m) => matchMember(m, q)));
});
}
}

// Run
init();
})();

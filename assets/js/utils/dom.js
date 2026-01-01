/* ==========================================================================
ARC-方舟｜dom.js
- 目的：DOM 建構與可重用 UI 元件（cards, pills, empty state）
- 依賴：無（可選配 ARC 工具：若 app.js 已載入，可用 window.ARC）
- 使用：頁面中引入後，可用 ARC_DOM.* 生成節點
========================================================================== */

(function (global) {
"use strict";

const DOM = {};

/* -----------------------------
0) Basics
----------------------------- */
DOM.el = function (tag, attrs, children) {
const n = document.createElement(tag);

if (attrs && typeof attrs === "object") {
Object.entries(attrs).forEach(([k, v]) => {
if (v === undefined || v === null) return;

if (k === "class") n.className = v;
else if (k === "text") n.textContent = v;
else if (k === "html") n.innerHTML = v;
else if (k === "dataset" && typeof v === "object") {
Object.entries(v).forEach(([dk, dv]) => (n.dataset[dk] = dv));
} else if (k.startsWith("on") && typeof v === "function") {
// e.g. onclick, oninput
n.addEventListener(k.slice(2), v);
} else {
n.setAttribute(k, v);
}
});
}

if (Array.isArray(children)) {
children.forEach((c) => {
if (c === undefined || c === null) return;
n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
});
} else if (typeof children === "string") {
n.textContent = children;
} else if (children instanceof Node) {
n.appendChild(children);
}

return n;
};

DOM.clear = function (node) {
while (node && node.firstChild) node.removeChild(node.firstChild);
};

DOM.fragment = function (nodes) {
const f = document.createDocumentFragment();
(nodes || []).forEach((n) => n && f.appendChild(n));
return f;
};

DOM.escapeHtml = function (s) {
return (s || "").toString()
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
};

/* -----------------------------
1) UI primitives
----------------------------- */

DOM.pill = function (text, variant) {
const cls = ["pill"];
if (variant === "accent") cls.push("pill-accent");
if (variant === "warn") cls.push("pill-warn");
if (variant === "danger") cls.push("pill-danger");

return DOM.el("span", { class: cls.join(" "), text: text || "" });
};

DOM.buttonLink = function (label, href, variant) {
const cls = ["btn"];
if (variant === "primary") cls.push("btn-primary");
if (variant === "warn") cls.push("btn-warn");

const attrs = {
class: cls.join(" "),
href: href || "#"
};

if ((href || "").startsWith("http")) {
attrs.target = "_blank";
attrs.rel = "noopener";
}

return DOM.el("a", attrs, label || "連結");
};

DOM.emptyState = function (title, detail) {
const wrap = DOM.el("div", {
class: "card",
style:
"border-style:dashed; background:rgba(0,0,0,.10); color:rgba(255,255,255,.70);"
});

wrap.appendChild(DOM.el("div", { style: "font-weight:850; margin-bottom:6px;" }, title || "沒有資料"));
if (detail) {
wrap.appendChild(
DOM.el("div", { style: "color:rgba(255,255,255,.58); line-height:1.7;" }, detail)
);
}

return wrap;
};

/* -----------------------------
2) Team member card
- Data shape (suggested):
{ name, role, bio, avatar, tags:[], links:[{label,url}] }
----------------------------- */
DOM.teamCard = function (m) {
const name = (m && m.name) || "未命名";
const role = (m && m.role) || "—";
const bio = (m && m.bio) || "（尚未填寫簡介）";
const avatar = (m && m.avatar) || "../assets/img/team/gm.png";
const tags = Array.isArray(m && m.tags) ? m.tags : [];
const links = Array.isArray(m && m.links) ? m.links : [];

const img = DOM.el("img", {
src: avatar,
alt: name,
onerror: function () { this.src = "../assets/img/team/gm.png"; }
});

const top = DOM.el("div", { class: "team-member__top" }, [
DOM.el("div", { class: "team-member__avatar" }, [img]),
DOM.el("div", { class: "team-member__meta" }, [
DOM.el("div", { class: "team-member__name", text: name }),
DOM.el("div", { class: "team-member__role" }, [
DOM.el("span", { text: role }),
...tags.slice(0, 3).map((t, i) => DOM.pill(t, i % 2 === 0 ? "accent" : "warn"))
])
])
]);

const linkRow = DOM.el("div", { class: "team-member__links" }, links.slice(0, 3).map((l) => {
const url = (l && l.url) || "#";
const label = (l && l.label) || "連結";
return DOM.el("a", {
class: "team-link",
href: url,
target: url.startsWith("http") ? "_blank" : null,
rel: url.startsWith("http") ? "noopener" : null,
text: label
});
}));

return DOM.el("article", { class: "team-member" }, [
top,
DOM.el("div", { class: "team-member__bio", text: bio }),
linkRow
]);
};

/* -----------------------------
3) Article list card
- Data shape:
{ id, title, excerpt, cover, date, tags:[] }
----------------------------- */
DOM.articleCard = function (a) {
const id = (a && a.id) || "";
const title = (a && a.title) || "未命名文章";
const excerpt = (a && a.excerpt) || "（尚未填寫摘要）";
const cover = (a && a.cover) || "../assets/img/articles/a-0001-cover.jpg";
const date = (a && a.date) || "";
const tags = Array.isArray(a && a.tags) ? a.tags : [];

const coverImg = DOM.el("img", {
src: cover,
alt: title,
onerror: function () { this.style.opacity = ".35"; }
});

const meta = DOM.el("div", { class: "article-card__meta" }, [
date ? DOM.pill(date, null) : null,
...tags.slice(0, 2).map((t) => DOM.pill(t, "accent"))
].filter(Boolean));

const actions = DOM.el("div", { class: "article-card__actions" }, [
DOM.el("a", { class: "article-read", href: `./article.html?id=${encodeURIComponent(id)}`, text: "閱讀全文" }),
DOM.el("span", { class: "hint" }, [
"ID：",
DOM.el("span", { class: "mono", text: id || "N/A" })
])
]);

const body = DOM.el("div", { class: "article-card__body" }, [
DOM.el("h3", { class: "article-card__title", text: title }),
meta,
DOM.el("p", { class: "article-card__excerpt", text: excerpt }),
actions
]);

return DOM.el("article", { class: "article-card" }, [
DOM.el("div", { class: "article-card__cover" }, [coverImg]),
body
]);
};

/* -----------------------------
4) Export
----------------------------- */
global.ARC_DOM = DOM;
})(window);

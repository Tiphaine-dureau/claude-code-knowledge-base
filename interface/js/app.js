// @ts-check
import { countByTopic, escapeHtml as esc, filterItems, formatDate, prepareData, topicHue } from "./lib.js";
import { initInbox } from "./inbox.js";

/** @typedef {import("./lib.js").ViewData} ViewData */
/** @typedef {import("./lib.js").Insight} Insight */
/** @typedef {import("./lib.js").Reel} Reel */
/** @typedef {"insights" | "reels"} View */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

const ICON_CHEVRON = '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const ICON_ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ICON_EXTERNAL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

/** Préférences mémorisées sur l'appareil (le navigateur peut refuser le stockage). */
const prefs = {
  /** @param {string} key */
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  /** @param {string} key @param {string} value */
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* sans mémoire */ } },
};

const state = {
  /** @type {ViewData | null} */ data: null,
  /** @type {View} */ view: "insights",
  topic: "all",
  query: "",
};

// ── Rendu ────────────────────────────────────────────────────────────────

/** @param {string} name */
const tintStyle = (name) => {
  const [h, s] = topicHue(name);
  return `--h:${h};--s:${s}%`;
};

/** @param {string[]} topicIds */
function topicTags(topicIds) {
  const { topicsById } = /** @type {ViewData} */ (state.data);
  return topicIds
    .map((id) => topicsById.get(id))
    .filter((t) => t !== undefined)
    .map((t) => `<span class="tag" style="${tintStyle(t.name)}">${esc(t.name)}</span>`)
    .join("");
}

const NEW_BADGE = '<span class="new">New</span>';

/**
 * Carte accordéon. Une carte « nouvelle » (dernier import) est bordée et porte le badge New.
 * @param {{ id: string, head: string, foot: string, panel: string, isNew: boolean }} c
 */
function card({ id, head, foot, panel, isNew }) {
  const panelId = `p-${id}`;
  return `<article class="card${isNew ? " is-new" : ""}" id="c-${id}">
    <button class="toggle" aria-expanded="false" aria-controls="${panelId}">
      ${head}
      <div class="foot"><span>${foot}</span>${ICON_CHEVRON}</div>
    </button>
    <div class="panel" id="${panelId}" hidden>${panel}</div>
  </article>`;
}

/** @param {string} url */
const instagramLink = (url) => `<a class="link" href="${esc(url)}" target="_blank" rel="noopener">Voir sur Instagram ${ICON_EXTERNAL}</a>`;

/** Lien interne : ouvre la carte du Reel dans l'onglet Reels. @param {string} reelId */
const readReelLink = (reelId) => `<button class="link" type="button" data-reel="${esc(reelId)}">Lire le Reel ${ICON_ARROW}</button>`;

/** @param {Insight} i */
function insightCard(i) {
  const creators = i.authors.length > 1 ? `<span class="conv">${i.authors.length} créateurs</span>` : "";
  const many = i.reels.length > 1;
  return card({
    id: i.id,
    isNew: i.isNew,
    head: `<div class="row">${i.isNew ? NEW_BADGE : ""}${topicTags(i.topics)}${creators}</div><p class="insight">${esc(i.text)}</p>`,
    foot: `${many ? `${i.reels.length} sources` : "1 source"} · ${esc(i.authors.join(", "))}`,
    panel: `<p class="label">${many ? "Reels sources" : "Reel source"}</p>` +
      i.reels.map((r) => `<section class="src${r.isNew ? " is-new" : ""}">
        <h3>${r.isNew ? NEW_BADGE : ""}${esc(r.title)}</h3>
        <span class="by">${esc(r.author)} · ${formatDate(r.date)}</span>
        <p>${esc(r.summary)}</p>
        ${readReelLink(r.id)}
      </section>`).join(""),
  });
}

/** @param {Reel} r */
function reelCard(r) {
  const takeaways = r.insights.length
    ? `<p class="label">Ce qu'on en retient</p><ul class="mini">${r.insights.map((i) => `<li>${esc(i.text)}</li>`).join("")}</ul>`
    : "";
  return card({
    id: r.id,
    isNew: r.isNew,
    head: `<div class="row">${r.isNew ? NEW_BADGE : ""}${topicTags(r.topics)}</div><h2 class="reel-title">${esc(r.title)}</h2>`,
    foot: `${esc(r.author)} · ${formatDate(r.date)}`,
    panel: `<p class="label">Résumé</p><p>${esc(r.summary)}</p>${takeaways}${instagramLink(r.url)}`,
  });
}

/** @param {{ topics: string[] }[]} items */
function renderChips(items) {
  const { topics } = /** @type {ViewData} */ (state.data);
  const counts = countByTopic(items);
  const chip = (/** @type {string} */ id, /** @type {string} */ label, /** @type {number} */ n, style = "", dot = "") =>
    `<button class="chip" data-topic="${id}" style="${style}" aria-pressed="${state.topic === id}">${dot}${label} <span class="c">${n}</span></button>`;

  $("chips").innerHTML =
    chip("all", "Tous", items.length) +
    topics
      .filter((t) => counts.has(t.id))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      .map((t) => chip(t.id, esc(t.name), counts.get(t.id) ?? 0, tintStyle(t.name), '<span class="dot"></span>'))
      .join("");

  if (state.topic !== "all") $("chips").querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  updateChipsFade();
}

function updateChipsFade() {
  const c = $("chips");
  $("chips-wrap").classList.toggle("at-end", c.scrollLeft + c.clientWidth >= c.scrollWidth - 4);
}

function render() {
  const data = /** @type {ViewData} */ (state.data);
  const all = state.view === "insights" ? data.insights : data.reels;
  if (state.topic !== "all" && !all.some((it) => it.topics.includes(state.topic))) state.topic = "all";

  for (const tab of document.querySelectorAll(".tab")) {
    tab.setAttribute("aria-selected", String(/** @type {HTMLElement} */ (tab).dataset.view === state.view));
  }
  renderChips(all);

  const cards = state.view === "insights"
    ? filterItems(data.insights, state).map(insightCard)
    : filterItems(data.reels, state).map(reelCard);
  const q = state.query.trim();
  $("list").innerHTML = cards.length
    ? cards.join("")
    : `<p class="empty">Aucun résultat${q ? ` pour « ${esc(q)} »` : ""}.</p>`;
}

/**
 * Ouvre un Reel dans l'onglet Reels : garde le filtre de Topic s'il contient ce Reel, vide la recherche,
 * déplie la carte et la fait défiler sous l'en-tête.
 * @param {string} id
 */
function openReel(id) {
  const data = /** @type {ViewData} */ (state.data);
  const reel = data.reels.find((r) => r.id === id);
  if (!reel) return;
  state.view = "reels";
  prefs.set("view", state.view);
  if (state.topic !== "all" && !reel.topics.includes(state.topic)) state.topic = "all";
  state.query = "";
  /** @type {HTMLInputElement} */ ($("q")).value = "";
  render();

  const article = $(`c-${id}`);
  const toggle = /** @type {HTMLElement} */ (article.querySelector(".toggle"));
  toggle.setAttribute("aria-expanded", "true");
  $(`p-${id}`).hidden = false;
  const offset = /** @type {HTMLElement} */ (document.querySelector(".bar")).offsetHeight + 12;
  window.scrollTo({ top: article.getBoundingClientRect().top + window.scrollY - offset });
  toggle.focus({ preventScroll: true });
  article.classList.add("flash");
  article.addEventListener("animationend", () => article.classList.remove("flash"), { once: true });
}

// ── Événements ───────────────────────────────────────────────────────────

/** @param {MouseEvent} e */
function onClick(e) {
  const target = /** @type {HTMLElement} */ (e.target);

  const tab = /** @type {HTMLElement | null} */ (target.closest(".tab"));
  if (tab) {
    state.view = tab.dataset.view === "reels" ? "reels" : "insights";
    prefs.set("view", state.view);
    window.scrollTo({ top: 0 });
    return render();
  }

  const chip = /** @type {HTMLElement | null} */ (target.closest(".chip"));
  if (chip) {
    state.topic = chip.dataset.topic ?? "all";
    prefs.set("topic", state.topic);
    return render();
  }

  const goto = /** @type {HTMLElement | null} */ (target.closest("[data-reel]"));
  if (goto) return openReel(goto.dataset.reel ?? "");

  const toggle = target.closest(".toggle");
  if (toggle) {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    $(/** @type {string} */ (toggle.getAttribute("aria-controls"))).hidden = !open;
  }
}

// ── Démarrage ────────────────────────────────────────────────────────────

/** @param {import("./lib.js").RawData} raw */
function start(raw) {
  const data = prepareData(raw);
  state.data = data;
  if (location.hash === "#reels" || prefs.get("view") === "reels") state.view = "reels";
  const savedTopic = prefs.get("topic");
  if (savedTopic && (savedTopic === "all" || data.topicsById.has(savedTopic))) state.topic = savedTopic;

  $("meta").textContent = `Mis à jour le ${formatDate(data.updated)}`;
  $("n-insights").textContent = String(data.insights.length);
  $("n-reels").textContent = String(data.reels.length);

  document.addEventListener("click", onClick);
  $("q").addEventListener("input", (e) => {
    state.query = /** @type {HTMLInputElement} */ (e.target).value;
    render();
  });
  $("chips").addEventListener("scroll", updateChipsFade, { passive: true });
  window.addEventListener("resize", updateChipsFade);
  render();
}

fetch("data.json", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then(start)
  .catch(() => {
    $("meta").textContent = "";
    $("list").innerHTML = '<p class="empty">Impossible de charger les données. Recharge la page ; si le problème persiste, relance /publier-insights.</p>';
  });

initInbox();

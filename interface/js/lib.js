// @ts-check
/**
 * Logique pure de l'interface : aucune dépendance au DOM, entièrement testable.
 */

/**
 * @typedef {{ id: string, name: string }} Topic
 * @typedef {{ title: string, author: string, date: string, url: string, summary: string }} RawReel
 * @typedef {{ id: string, text: string, topics: string[], sources: string[] }} RawInsight
 * @typedef {{ updated: string, topics: Topic[], reels: Record<string, RawReel>, insights: RawInsight[] }} RawData
 *
 * @typedef {RawReel & { id: string, topics: string[], insights: Insight[], hay: string }} Reel
 * @typedef {RawInsight & { reels: Reel[], authors: string[], hay: string }} Insight
 * @typedef {{ updated: string, topics: Topic[], topicsById: Map<string, Topic>, insights: Insight[], reels: Reel[] }} ViewData
 */

/** Teinte et saturation par Topic : nuances sobres pour repérer les thèmes d'un coup d'œil. */
export const TOPIC_HUES = /** @type {Record<string, [number, number]>} */ ({
  "skills": [226, 48],
  "agents": [14, 48],
  "subagents": [36, 52],
  "mcp": [266, 34],
  "claude.md": [196, 46],
  "context engineering": [162, 34],
  "hooks": [338, 36],
  "workflows & automatisations": [96, 30],
});

/**
 * Teinte d'un Topic. Un Topic inconnu reçoit une teinte stable dérivée de son nom.
 * @param {string} name
 * @returns {[number, number]} [teinte, saturation en %]
 */
export function topicHue(name) {
  const key = name.toLowerCase();
  if (TOPIC_HUES[key]) return TOPIC_HUES[key];
  let hue = 0;
  for (const ch of key) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return [hue, 32];
}

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/**
 * « 2026-09-28 » (ou un horodatage ISO complet) → « 28 sept. 2026 ».
 * @param {string} iso
 */
export function formatDate(iso) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Texte comparable pour la recherche : minuscules, sans accents.
 * @param {string} text
 */
export function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const REEL_URL = /instagram\.com\/(?:reels?|p)\/([A-Za-z0-9_-]{5,})/g;

/**
 * Extrait les shortCodes uniques de liens de Reels collés en vrac (paramètres de suivi ignorés).
 * @param {string} text
 * @returns {string[]}
 */
export function extractShortCodes(text) {
  return [...new Set(Array.from(text.matchAll(REEL_URL), (m) => m[1]))];
}

/**
 * Relie Insights, Reels et Topics, calcule les champs dérivés et trie :
 * Insights par convergence (créateurs distincts, puis sources, puis récence), Reels du plus récent au plus ancien.
 * Les sources et Topics inconnus sont ignorés.
 * @param {RawData} raw
 * @returns {ViewData}
 */
export function prepareData(raw) {
  const topicsById = new Map(raw.topics.map((t) => [t.id, t]));

  /** @type {Map<string, Reel>} */
  const reelsById = new Map(
    Object.entries(raw.reels).map(([id, r]) => [
      id,
      { ...r, id, topics: [], insights: [], hay: normalize(`${r.title} ${r.author} ${r.summary}`) },
    ]),
  );

  const insights = raw.insights.map((i) => {
    const reels = i.sources.flatMap((id) => reelsById.get(id) ?? []).sort(byDateDesc);
    return {
      ...i,
      topics: i.topics.filter((id) => topicsById.has(id)),
      reels,
      authors: [...new Set(reels.map((r) => r.author))],
      hay: normalize([i.text, ...reels.map((r) => r.hay)].join(" ")),
    };
  });

  for (const insight of insights) {
    for (const reel of insight.reels) {
      reel.insights.push(insight);
      for (const t of insight.topics) if (!reel.topics.includes(t)) reel.topics.push(t);
    }
  }

  insights.sort((a, b) =>
    b.authors.length - a.authors.length ||
    b.reels.length - a.reels.length ||
    (b.reels[0]?.date ?? "").localeCompare(a.reels[0]?.date ?? ""));

  return {
    updated: raw.updated,
    topics: raw.topics,
    topicsById,
    insights,
    reels: [...reelsById.values()].sort(byDateDesc),
  };
}

/** @param {{ date: string }} a @param {{ date: string }} b */
function byDateDesc(a, b) {
  return b.date.localeCompare(a.date);
}

/**
 * Nombre d'éléments par Topic.
 * @param {{ topics: string[] }[]} items
 * @returns {Map<string, number>}
 */
export function countByTopic(items) {
  const counts = new Map();
  for (const item of items) for (const t of item.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  return counts;
}

/**
 * Filtre par Topic ("all" = tous) et par recherche plein texte (insensible aux accents et à la casse).
 * @template {{ topics: string[], hay: string }} T
 * @param {T[]} items
 * @param {{ topic: string, query: string }} filters
 * @returns {T[]}
 */
export function filterItems(items, { topic, query }) {
  const q = normalize(query.trim());
  return items.filter((it) => (topic === "all" || it.topics.includes(topic)) && (!q || it.hay.includes(q)));
}

// Tests de la logique pure de l'interface. Lancer : npm test (dans interface/), aucune dépendance.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countByTopic, escapeHtml, extractShortCodes, filterItems, formatDate, normalize, prepareData, topicHue, TOPIC_HUES,
} from "../js/lib.js";

/** Jeu de données minimal : deux Topics, trois Reels, trois Insights. */
const fixture = () => ({
  updated: "2026-09-28",
  topics: [
    { id: "tSkills", name: "Skills" },
    { id: "tMcp", name: "MCP" },
  ],
  reels: {
    rA: { title: "Reel A", author: "Alice", date: "2026-08-01", url: "https://www.instagram.com/reel/AAAAA/", summary: "Superpowers et mémoire" },
    rB: { title: "Reel B", author: "Bob", date: "2026-09-01", url: "https://www.instagram.com/reel/BBBBB/", summary: "Playwright pilote un navigateur" },
    rC: { title: "Reel C", author: "Alice", date: "2026-07-01", url: "https://www.instagram.com/reel/CCCCC/", summary: "Encore Superpowers" },
  },
  insights: [
    { id: "i1", text: "Une seule source", topics: ["tSkills"], sources: ["rC"] },
    { id: "i2", text: "Deux créateurs", topics: ["tSkills", "tMcp"], sources: ["rA", "rB"] },
    { id: "i3", text: "Deux sources, un créateur", topics: ["tSkills", "tInconnu"], sources: ["rA", "rC", "rAbsent"] },
  ],
});

test("extractShortCodes : liens avec paramètres de suivi, /p/, /reels/, doublons", () => {
  const text = `
    https://www.instagram.com/reel/DdthKn4zua1/?stkn=MTlsOHpm
    https://www.instagram.com/p/DcES6LItnCw/?utm_source=ig_web_copy_link
    instagram.com/reels/Dcq-mLHN95-/  https://www.instagram.com/reel/DdthKn4zua1/?igsh=abc`;
  assert.deepEqual(extractShortCodes(text), ["DdthKn4zua1", "DcES6LItnCw", "Dcq-mLHN95-"]);
});

test("extractShortCodes : ignore profils, stories et autres sites", () => {
  const text = "https://www.instagram.com/zeyneb_madi/ https://www.instagram.com/stories/x/123 https://youtube.com/reel/ABCDEFG";
  assert.deepEqual(extractShortCodes(text), []);
});

test("formatDate : date seule ou horodatage ISO", () => {
  assert.equal(formatDate("2026-09-28"), "28 sept. 2026");
  assert.equal(formatDate("2026-05-03T18:14:24.000Z"), "3 mai 2026");
});

test("normalize : insensible aux accents et à la casse", () => {
  assert.equal(normalize("Mémoire Éphémère"), "memoire ephemere");
});

test("escapeHtml : neutralise le HTML", () => {
  assert.equal(escapeHtml(`<a href="x">l'"&</a>`), "&#60;a href=&#34;x&#34;&#62;l&#39;&#34;&#38;&#60;/a&#62;");
});

test("topicHue : teinte connue, et teinte stable pour un Topic inconnu", () => {
  assert.deepEqual(topicHue("Skills"), TOPIC_HUES.skills);
  const [h, s] = topicHue("Nouveau sujet");
  assert.ok(h >= 0 && h < 360);
  assert.equal(s, 32);
  assert.deepEqual(topicHue("Nouveau sujet"), topicHue("NOUVEAU SUJET"));
});

test("prepareData : sources et Topics inconnus ignorés, créateurs distincts", () => {
  const { insights } = prepareData(fixture());
  const i3 = insights.find((i) => i.id === "i3");
  assert.deepEqual(i3?.topics, ["tSkills"]);
  assert.deepEqual(i3?.reels.map((r) => r.id), ["rA", "rC"]);
  assert.deepEqual(i3?.authors, ["Alice"]);
});

test("prepareData : Insights triés par créateurs distincts, puis nombre de sources", () => {
  const { insights } = prepareData(fixture());
  assert.deepEqual(insights.map((i) => i.id), ["i2", "i3", "i1"]);
});

test("prepareData : sources d'un Insight du plus récent au plus ancien", () => {
  const { insights } = prepareData(fixture());
  assert.deepEqual(insights.find((i) => i.id === "i2")?.reels.map((r) => r.id), ["rB", "rA"]);
});

test("prepareData : Reels triés par date, avec leurs Insights et Topics déduits", () => {
  const { reels } = prepareData(fixture());
  assert.deepEqual(reels.map((r) => r.id), ["rB", "rA", "rC"]);
  const rA = reels.find((r) => r.id === "rA");
  assert.deepEqual(rA?.insights.map((i) => i.id).sort(), ["i2", "i3"]);
  assert.deepEqual(rA?.topics.sort(), ["tMcp", "tSkills"]);
});

test("countByTopic : compte les éléments par Topic", () => {
  const { insights } = prepareData(fixture());
  assert.deepEqual([...countByTopic(insights)].sort(), [["tMcp", 1], ["tSkills", 3]]);
});

test("filterItems : par Topic, par recherche sans accents, et combinés", () => {
  const { insights } = prepareData(fixture());
  const ids = (/** @type {{ id: string }[]} */ list) => list.map((i) => i.id);
  assert.deepEqual(ids(filterItems(insights, { topic: "tMcp", query: "" })), ["i2"]);
  assert.deepEqual(ids(filterItems(insights, { topic: "all", query: "  MÉMOIRE " })), ["i2", "i3"]);
  assert.deepEqual(ids(filterItems(insights, { topic: "tMcp", query: "memoire" })), ["i2"]);
  assert.deepEqual(ids(filterItems(insights, { topic: "all", query: "introuvable" })), []);
});

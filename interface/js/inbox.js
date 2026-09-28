// @ts-check
/**
 * File d'attente des Reels à importer, stockée dans la base de données de l'artefact
 * (collection `inbox`, un document par shortCode). Réservée aux éditeurs : les droits
 * sont aussi appliqués côté serveur, ce module ne fait que masquer l'interface aux autres.
 */
import { escapeHtml as esc, extractShortCodes, formatDate } from "./lib.js";

/** @typedef {{ shortCode: string, url: string, addedAt: string }} QueueItem */

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

const ICON_CLOSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

/**
 * Affiche le bouton « Ajouter » si la personne peut modifier l'artefact et que la base est disponible.
 * Hors de claude.ai (aperçu local), ne fait rien.
 */
export async function initInbox() {
  const claude = /** @type {any} */ (window).claude;
  if (!claude?.use) return;
  const user = await claude.use("user");
  if (!user || !(await user.canEdit())) return;
  const db = await claude.use("db");
  if (!db) return;

  const inbox = db.collection("inbox");
  /** @type {QueueItem[]} */
  let queue = [];

  const fab = $("fab");
  const sheet = $("sheet");
  const msg = $("add-msg");
  const textarea = /** @type {HTMLTextAreaElement} */ ($("links"));
  const addButton = /** @type {HTMLButtonElement} */ ($("add-links"));

  /** @param {boolean} open */
  const setOpen = (open) => {
    sheet.hidden = $("scrim").hidden = !open;
    if (open) { msg.textContent = ""; textarea.focus(); } else fab.focus();
  };

  const setAvailable = (/** @type {boolean} */ on) => {
    fab.hidden = !on;
    document.body.classList.toggle("has-fab", on);
    if (!on) setOpen(false);
  };

  function renderQueue() {
    const badge = $("fab-badge");
    badge.hidden = queue.length === 0;
    badge.textContent = String(queue.length);
    $("queue-label").hidden = queue.length === 0;
    $("queue").innerHTML = queue.map((q) => `<li>
      <code>${esc(q.shortCode)}</code>
      <span class="when">${q.addedAt ? formatDate(q.addedAt) : ""}</span>
      <button class="icon-btn" data-remove="${esc(q.shortCode)}" aria-label="Retirer ${esc(q.shortCode)} de la file">${ICON_CLOSE}</button>
    </li>`).join("");
  }

  async function addLinks() {
    const codes = extractShortCodes(textarea.value);
    if (!codes.length) { msg.textContent = "Aucun lien de Reel Instagram reconnu."; return; }

    const queued = new Set(queue.map((q) => q.shortCode));
    const fresh = codes.filter((c) => !queued.has(c));
    addButton.disabled = true;
    try {
      // Une écriture à la fois : la base traite les écritures d'un même client en série.
      for (const code of fresh) {
        await inbox.doc(code).set({ shortCode: code, url: `https://www.instagram.com/reel/${code}/`, addedAt: new Date().toISOString() });
      }
      textarea.value = "";
      const already = codes.length - fresh.length;
      const plural = fresh.length > 1 ? "s" : "";
      msg.textContent = [
        fresh.length ? `${fresh.length} Reel${plural} ajouté${plural} à la file.` : "",
        already ? `${already} déjà en attente.` : "",
      ].filter(Boolean).join(" ");
    } catch (/** @type {any} */ e) {
      msg.textContent = e?.code === "quota_exceeded"
        ? "La file est pleine : lance /ajouter-reel pour la vider."
        : "L'ajout a échoué. Vérifie ta connexion et réessaie.";
    } finally {
      addButton.disabled = false;
    }
  }

  setAvailable(true);
  inbox.orderBy("addedAt").onSnapshot(
    (/** @type {any} */ snap) => { queue = snap.docs.map((/** @type {any} */ d) => d.data()); renderQueue(); },
    () => setAvailable(false),
  );

  fab.addEventListener("click", () => setOpen(true));
  $("scrim").addEventListener("click", () => setOpen(false));
  $("close-sheet").addEventListener("click", () => setOpen(false));
  sheet.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  addButton.addEventListener("click", addLinks);
  $("queue").addEventListener("click", (e) => {
    const button = /** @type {HTMLElement} */ (e.target).closest("[data-remove]");
    if (!button) return;
    inbox.doc(/** @type {HTMLElement} */ (button).dataset.remove).delete()
      .catch(() => { msg.textContent = "Impossible de retirer ce lien pour l'instant."; });
  });
}

# Claude Code Knowledge Base

Veille Instagram sur Claude Code, transformée en base de connaissances structurée dans Notion.

Chaîne : URL de Reel (ajout manuel, puis comptes surveillés en phase 4) → **Apify** (`apify/instagram-reel-scraper`, option transcript activée) → **Claude Code** (analyse, classement, déduplication) → **Notion** (via MCP).

Conception complète, décisions et feuille de route : `Claude_Code_Knowledge_Base_V1.md`. La lire avant toute décision d'architecture. L'avancement suit sa section 23.

## Règle centrale : enrichir plutôt que dupliquer

- Un Reel n'est pas un Topic. Plusieurs Reels alimentent le même Topic.
- Avant de créer un Topic, chercher parmi les Topics existants. Si le sujet existe, l'enrichir.
- La décision repose sur le **contenu réel** du Reel (transcript), pas sur la caption, souvent inexploitable (« commente X pour recevoir Y en DM »).
- Avant toute insertion dans 🎬 Reels, vérifier que le `shortCode` n'y existe pas déjà. S'il existe : ne rien recréer.

## Notion : page « Claude Code Knowledge Base »

Notion ne sert qu'au stockage et à la consultation. Les règles métier vivent ici et dans les skills du projet, pas dans Notion.

### 🎬 Reels (les sources)

| Propriété | Type |
|---|---|
| Reel | Title |
| URL | URL |
| Auteur | Text |
| Date | Date |
| Date d'import | Date |
| Caption | Text |
| Transcript | Text |
| Résumé | Text |
| Sujet principal | Select |
| Topics liés | Relation → Topics |
| Insights associés | Relation → Insights |
| Statut | Select : 🔴 À traiter · 🟡 En cours · 🟢 Traité |

### 📚 Topics (les sujets)

Page de documentation avec les sections : 🧠 Définition · 🎯 À quoi ça sert ? · ⚙️ Comment ça fonctionne ? · 🛠️ Mise en pratique · 💡 Insights clés · 🎬 Reels associés · 🔗 Ressources complémentaires.

### 💡 Insights (ce qu'on retient)

| Propriété | Type |
|---|---|
| Insight | Title |
| Topic | Relation → Topics |
| Source | Relation → Reels |
| Statut | Select : 🔴 À vérifier · 🟡 À tester · 🟢 Validé |

Un nouvel Insight est toujours créé en 🔴 À vérifier.

### Sujets principaux (liste fermée)

Skills · Agents · Subagents · MCP · CLAUDE.md · Context engineering · Hooks

Le champ « Sujet principal » prend obligatoirement une de ces valeurs. De nouveaux Topics peuvent apparaître, mais seulement pour des sujets réellement distincts.

## Données Apify

- URL : `url`, ou reconstruite depuis `shortCode`. Ne jamais stocker `inputUrl` (paramètres de suivi).
- Auteur : `ownerFullName`, sinon `ownerUsername`.
- Ne pas stocker `videoUrl`, `audioUrl` ni `displayUrl` (liens qui expirent), ni les likes, vues, commentaires.
- Ne collecter que ce qui sert la base (RGPD).

## Secrets

Aucun token (Apify, Notion…) dans ce dépôt, ni dans ce fichier, ni dans la doc. Les secrets restent dans la configuration locale des serveurs MCP ou dans un `.env` (ignoré par git).

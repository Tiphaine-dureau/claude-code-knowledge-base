# Claude Code Knowledge Base

Veille Instagram sur Claude Code, transformée en base de connaissances structurée dans Notion.

Chaîne : URL de Reel (ajout manuel, puis comptes surveillés en phase 4) → **Apify** (`apify/instagram-reel-scraper`, option transcript activée) → **Claude Code** (analyse, classement, déduplication) → **Notion** (via MCP).

Conception complète, décisions et feuille de route : `Claude_Code_Knowledge_Base_V1.md`. La lire avant toute décision d'architecture. L'avancement suit sa section 23.

## Règle centrale : enrichir plutôt que dupliquer

- Un Reel n'est pas un Topic. Plusieurs Reels alimentent le même Topic.
- Avant de créer un Topic, chercher parmi les Topics existants. Si le sujet existe, l'enrichir.
- La décision repose sur le **contenu réel** du Reel (transcript), pas sur la caption, souvent inexploitable (« commente X pour recevoir Y en DM »).
- Avant toute insertion dans 🎬 Reels, vérifier que le `shortCode` n'y existe pas déjà (filtre sur la propriété `shortCode`). S'il existe : ne rien recréer. Ne jamais dédupliquer sur l'URL complète : ses paramètres changent à chaque partage.

## Notion : page « Claude Code Knowledge Base »

Notion ne sert qu'au stockage et à la consultation. Les règles métier vivent ici et dans les skills du projet, pas dans Notion.

Accès via le serveur MCP `notion` du projet (connexion par jeton, limitée à cette page). Les noms ci-dessous sont les noms **exacts** dans Notion (casse, accents, emojis compris) : les utiliser tels quels.

### 🎬 Reels (les sources)

Data source : `3d41c46e-c16a-806a-8a58-000b9125ff1d`

| Propriété | Type |
|---|---|
| Reel | Title |
| shortCode | Text (identifiant unique Instagram, clé de déduplication) |
| URL | URL |
| Auteur | Text |
| Date | Date (publication) |
| Date import | Date |
| Caption | Text |
| Transcript | Text |
| Résumé | Text |
| Sujet principal | Select |
| Topics liés | Relation → Topics |
| 💡 Insights associés | Relation → Insights (synchronisée avec `Source`) |
| Statut | Select : `a traiter` · `en cours` · `traité` |

### 🗂️ Topics (les sujets)

Data source : `3d41c46e-c16a-8022-8d72-000b95f0613d`

| Propriété | Type |
|---|---|
| Topics | Title |
| ▶️ Reels | Relation → Reels (synchronisée avec `Topics liés`) |
| 💡 Insights | Relation → Insights (synchronisée avec `Topics`) |

Page de documentation avec les sections : 🧠 Définition · 🎯 À quoi ça sert ? · ⚙️ Comment ça fonctionne ? · 🛠️ Mise en pratique · 💡 Insights clés · 🎬 Reels associés · 🔗 Ressources complémentaires.

La base a un modèle Notion nommé « Template ». L'API le renvoie parmi les pages : ce n'est pas un Topic, l'ignorer.

### 💡 Insights (ce qu'on retient)

Data source : `3d41c46e-c16a-8022-9ec4-000b8f7e0ba2`

| Propriété | Type |
|---|---|
| Insight | Title |
| Topics | Relation → Topics |
| Source | Relation → Reels |
| Statut | Select : `A vérifier` · `A tester` · `Validé` |

Un nouvel Insight est toujours créé en `A vérifier`.

### Sujets principaux (liste fermée)

Skills · Agents · Subagents · MCP · CLAUDE.md · Context Engineering · Hooks

Le champ « Sujet principal » prend obligatoirement une de ces valeurs. De nouveaux Topics peuvent apparaître, mais seulement pour des sujets réellement distincts.

## Données Apify

Accès via le serveur MCP `apify` du projet, limité à l'actor `apify/instagram-reel-scraper`.

- Toujours activer l'option transcript (`includeTranscript: true`). Laisser désactivées les options de partages et de téléchargement de la vidéo.
- Plafond de coût : **0,20 $ par run** (`maxTotalChargeUsd`). Regrouper plusieurs URL dans un même run quand c'est possible.
- Vérifier le `shortCode` dans Notion **avant** de lancer l'actor : un Reel déjà en base ne doit pas coûter un run.

- URL : `url`, ou reconstruite depuis `shortCode`. Ne jamais stocker `inputUrl` (paramètres de suivi).
- Auteur : `ownerFullName`, sinon `ownerUsername`.
- Ne pas stocker `videoUrl`, `audioUrl` ni `displayUrl` (liens qui expirent), ni les likes, vues, commentaires.
- Ne collecter que ce qui sert la base (RGPD).

## Secrets

Aucun token (Apify, Notion…) dans ce dépôt, ni dans ce fichier, ni dans la doc. Les secrets restent dans la configuration locale des serveurs MCP ou dans un `.env` (ignoré par git).

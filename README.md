# Claude Code Knowledge Base

Veille Instagram sur Claude Code, transformée en base de connaissances structurée dans Notion et consultable depuis une page web.

Je repère un Reel intéressant → je colle son lien → Claude Code le récupère, l'analyse, le classe sans créer de doublon → Notion et la page web sont mis à jour.

## Fonctionnement

```text
Téléphone ou PC                 PC                                         Consultation
────────────────                ─────────────────────────────              ─────────────────────
Lien d'un Reel  ─┬─► 📥 Boîte d'entrée Notion ─┐
                 └─► Bouton « Ajouter »        ├─► /ajouter-reel ─► Apify (transcript)
                     de la page web ───────────┘        │
                                                         ▼
                                              Claude Code : pertinence, résumé,
                                              Topic, Insights, déduplication
                                                         │
                                                         ▼
                                              Notion : 🎬 Reels · 🗂️ Topics · 💡 Insights
                                                         │
                                                         ▼
                                              /publier-insights ─────────────────► Page web « Veille Claude Code »
```

- **Apify** (`apify/instagram-reel-scraper`) récupère les métadonnées et le transcript de chaque Reel.
- **Claude Code** décide de la pertinence, rédige le résumé et les Insights, rattache le Reel à un Topic existant ou en propose un nouveau. Il te pose ses questions en une fois quand un cas est incertain.
- **Notion** stocke la connaissance : les Reels (sources), les Topics (sujets documentés) et les Insights (ce qu'on retient, avec leurs sources).
- **La page web** affiche les Insights par Topic, triés par convergence (le nombre de créateurs qui disent la même chose), avec le résumé des Reels sources.

Règle centrale : **enrichir plutôt que dupliquer**. Un Reel déjà en base n'est jamais retraité (déduplication par `shortCode`, avant toute dépense Apify). Une idée déjà présente reçoit une source de plus au lieu d'un nouvel Insight.

## Utilisation au quotidien

1. **Repérer un Reel** et ajouter son lien, au choix :
   - dans la base Notion **📥 À importer** (depuis l'application Notion, en collant le lien) ;
   - avec le bouton **« + Ajouter »** de la page web (visible uniquement pour la propriétaire et les éditeurs).
2. **Sur le PC**, dans une session Claude Code ouverte sur ce dossier :

   ```
   /ajouter-reel
   ```

   Sans argument, la commande traite les deux files d'attente puis les vide. On peut aussi lui passer directement des liens : `/ajouter-reel <url> <url>`.
3. **Consulter** la page web, mise à jour automatiquement à la fin de l'import : https://claude.ai/artifact/NphDoxdMUmRvSspUdtrfxK (privée, partageable par invitation depuis son menu Partager).

Pour republier la page sans importer de Reel (après une modification manuelle dans Notion par exemple) : `/publier-insights`.

## Installation

Prérequis : l'application Claude (onglet Code), Node.js 20 ou plus, un compte Notion, un compte Apify (plan gratuit).

1. **Notion** : créer une connexion par **jeton d'accès** (notion.so/profile/integrations), avec les droits lire, mettre à jour et insérer du contenu, puis la partager avec la page « Claude Code Knowledge Base » (••• → Connexions). Elle ne voit ainsi que cette page.
2. **Apify** : récupérer le token personnel (Settings → API & Integrations) et fixer un **plafond mensuel de 5 $** (Settings → Usage & billing) pour rester dans le crédit gratuit.
3. **Variables d'environnement Windows**, dans PowerShell (jamais dans le dépôt) :

   ```powershell
   [Environment]::SetEnvironmentVariable("NOTION_TOKEN", "ntn_…", "User")
   [Environment]::SetEnvironmentVariable("APIFY_TOKEN", "apify_api_…", "User")
   ```

4. **Quitter complètement l'application Claude** (y compris depuis la zone de notification) puis la relancer, pour qu'elle voie les variables. Les serveurs MCP `notion` et `apify` déclarés dans `.mcp.json` démarrent alors avec le projet.

## Organisation du dépôt

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Instructions permanentes de Claude Code : règles de décision, noms exacts des bases Notion, contraintes techniques |
| `Claude_Code_Knowledge_Base_V1.md` | Document de conception : objectifs, décisions, feuille de route (section 23), points à décider (section 24) |
| `.mcp.json` | Serveurs MCP du projet (Notion, Apify limité au seul actor utilisé). Les jetons sont lus dans les variables d'environnement |
| `.claude/skills/ajouter-reel/` | Procédure d'import d'un ou plusieurs Reels |
| `.claude/skills/publier-insights/` | Régénération des données de la page web et republication |
| `.claude/launch.json` | Serveur d'aperçu local de la page web |
| `interface/` | Page web (voir ci-dessous) |

## Page web (`interface/`)

Page statique publiée comme artefact claude.ai. Mobile d'abord : onglets, cartes, accordéons, pas de tableau. Thème clair et sombre automatique.

| Fichier | Rôle |
|---|---|
| `index.html` | Structure |
| `styles.css` | Styles (CSS natif, thème par variables) |
| `js/lib.js` | Logique pure : préparation des données, tri, filtres, extraction des liens. Aucun accès au DOM |
| `js/app.js` | Affichage et interactions |
| `js/inbox.js` | Bouton « Ajouter » et file d'attente (base de données de l'artefact, réservée aux éditeurs) |
| `tests/lib.test.js` | Tests unitaires de `lib.js` |
| `data.json` | Données générées depuis Notion par `/publier-insights` (non versionné) |

JavaScript en modules ES, typé en JSDoc avec `// @ts-check` : pas de TypeScript ni de SCSS, donc aucune étape de compilation.

```bash
cd interface
npm test          # tests unitaires (lanceur intégré de Node, aucune dépendance)
npm run serve     # aperçu local sur http://localhost:5173
```

L'aperçu local a besoin d'un `data.json` (lancer `/publier-insights` une fois). Le bouton « Ajouter » n'y apparaît pas : il n'existe que sur claude.ai.

## Données et confidentialité

- **Aucun secret dans le dépôt** : les jetons Notion et Apify restent dans les variables d'environnement Windows.
- **Minimum de données** : ni likes, ni vues, ni commentaires, ni liens vidéo. Les Reels non pertinents sont gardés en fiche minimale (statut `écarté`) uniquement pour ne pas les re-scraper.
- **La page web** ne contient que les Reels traités, leurs résumés et les Insights : ni transcript, ni caption, ni lien vers Notion. Comme elle utilise une base de données pour la file d'attente, elle se partage par invitation, pas par lien public.

## Coûts

- Apify : environ 0,05 à 0,10 $ par Reel avec transcript, dans la limite du crédit gratuit de 5 $ par mois (plafond fixé sur le compte).
- Claude Code : inclus dans l'abonnement Claude.
- Notion, hébergement de la page, GitHub : gratuits.

## Pistes à décider

- **Surveillance automatique de comptes Instagram** : en pause, le coût du transcript la rend incompatible avec le plan gratuit. Piste de repli : transcription locale gratuite (yt-dlp, Whisper).
- **Lancer le traitement sans le PC** : session Claude Code dans le cloud ou Routine planifiée. Détails et compromis dans la section 24 du document de conception.
- **Une seule file d'attente** : la boîte Notion et le bouton de la page coexistent pour l'instant ; l'une pourra être supprimée à l'usage.

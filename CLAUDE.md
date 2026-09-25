# Claude Code Knowledge Base

Veille Instagram sur Claude Code, transformée en base de connaissances structurée dans Notion.

Chaîne : URL de Reel (ajout manuel, puis comptes surveillés en phase 4) → **Apify** (`apify/instagram-reel-scraper`, option transcript activée) → **Claude Code** (analyse, classement, déduplication) → **Notion** (via MCP).

Conception complète, décisions et feuille de route : `Claude_Code_Knowledge_Base_V1.md`. La lire avant toute décision d'architecture. L'avancement suit sa section 23.

## Règle centrale : enrichir plutôt que dupliquer

- Un Reel n'est pas un Topic. Plusieurs Reels alimentent le même Topic.
- Avant de créer un Topic, chercher parmi les Topics existants. Si le sujet existe, l'enrichir.
- La décision repose sur le **contenu réel** du Reel (transcript), pas sur la caption, souvent inexploitable (« commente X pour recevoir Y en DM »).
- Avant toute insertion dans 🎬 Reels, vérifier que le `shortCode` n'y existe pas déjà (filtre sur la propriété `shortCode`). S'il existe : ne rien recréer. Ne jamais dédupliquer sur l'URL complète : ses paramètres changent à chaque partage.

## Traitement d'un Reel (procédure)

1. **shortCode** : l'extraire de l'URL fournie (`/reel/<shortCode>/` ou `/p/<shortCode>/`), paramètres de suivi ignorés.
2. **Doublon** : chercher ce `shortCode` dans 🎬 Reels. S'il existe (y compris en statut `écarté`) : s'arrêter, ne pas lancer Apify, signaler le Reel existant et son statut.
3. **Apify** : lancer l'actor sur l'URL propre, transcript activé, lire uniquement les champs utiles.
4. **Pertinence** : décider à partir du transcript (voir règles ci-dessous).
5. **Analyse** : titre, résumé, sujet principal, Topics, Insights, caption utile ou non.
6. **Écriture Notion**, dans cet ordre : Topic (création si validée) → Reel en `en cours` → Insights reliés au Reel et au Topic → enrichissement du Topic → Reel en `traité`.
7. **Compte rendu** : lister ce qui a été créé, enrichi ou laissé de côté, avec les liens Notion.

En cas d'erreur en cours de route, laisser le Reel en `a traiter` plutôt que de perdre l'information, et le signaler.

## Règles de décision

### Pertinence

- **Pertinent** : le contenu parle de Claude Code, ou de Claude utilisé pour construire quelque chose (skills, agents, MCP, automatisations, configuration, bonnes pratiques…).
- **Non pertinent** : Claude n'est qu'un prétexte, ou le contenu parle d'un autre outil. Créer une **fiche minimale** dans 🎬 Reels, pour ne jamais relancer Apify dessus :
  - `Reel` : titre court, `shortCode`, `URL` (propre), `Auteur`, `Date`, `Date import` ;
  - `Résumé` : la raison de l'écart en une phrase, préfixée par « Écarté : » ;
  - `Statut` : `écarté` ;
  - rien d'autre : pas de transcript, de caption, de sujet principal, de Topic ni d'Insight.

  Le signaler dans le compte rendu. Pour réintégrer un Reel écarté par erreur : repasser son statut en `a traiter` et relancer le traitement (Apify sera alors relancé).
- En cas de doute : demander.

### Sujet principal et Topics

- Le **sujet principal** prend une valeur de la liste fermée. Si aucune ne convient vraiment, ne pas forcer : proposer un nouveau sujet et **demander** avant de l'ajouter (option du Select + Topic créé depuis le modèle « Template » + liste fermée de ce fichier).
- Rapprocher le contenu du Reel des Topics existants (lire leur page si besoin) et estimer la correspondance :
  - **plus de 85 %** : même sujet → enrichir ce Topic, sans demander ;
  - **60 à 85 %** : correspondance possible → **demander** en présentant le Topic candidat et l'alternative ;
  - **moins de 60 %** : sujet nouveau → proposer la création et **demander**.
- `Topics liés` contient le Topic principal, plus un Topic secondaire seulement si le Reel lui apporte une information réelle (pas une simple mention).

### Enrichir un Topic

- **Ajouter, ne jamais réécrire** : ne rien supprimer ni reformuler de ce qui existe (le texte a pu être écrit à la main).
- Une section qui contient encore la phrase d'aide du modèle (« Qu'est-ce que c'est ? », etc.) peut être remplie : remplacer la phrase d'aide.
- Une section déjà remplie : ajouter une puce seulement si le Reel apporte un élément **nouveau**, en citant la source (auteur, mois).
- Si le Reel n'apporte rien de nouveau au Topic : le relier quand même (`Topics liés`), sans toucher au contenu.
- Ne pas toucher aux vues liées ni aux sections « 💡 Insights clés » et « 🎬 Reels associés » (alimentées par les relations).

### Insights

- 1 à 3 par Reel. Chacun est une phrase autonome, compréhensible sans voir la vidéo, qui dit ce qu'on apprend ou ce qu'on peut faire.
- Pas d'Insight pour une promesse vide (« je t'envoie la skill en DM ») ou une information générique.
- Avant d'en créer un, lire les Insights du Topic : si la même idée existe déjà, **ajouter le Reel à sa `Source`** au lieu de créer un doublon (c'est ce qui fera apparaître les convergences entre créateurs).
- Statut : toujours `A vérifier` à la création.

### Champs du Reel

- **Reel** (titre) : court, en français, dit ce qu'on apprend (pas le titre accrocheur de la vidéo).
- **Résumé** : 2 à 4 phrases, factuelles, basées sur le transcript.
- **Caption** : la stocker seulement si elle parle du contenu du Reel. Si elle ne contient qu'un appel à l'action (« commente X », « abonne-toi pour le guide »…) : laisser vide.
- **Date import** : date du jour.

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
| Statut | Select : `a traiter` · `en cours` · `traité` · `écarté` (non pertinent, fiche minimale) |

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

Skills · Agents · Subagents · MCP · CLAUDE.md · Context Engineering · Hooks · Workflows & automatisations

Le champ « Sujet principal » prend obligatoirement une de ces valeurs. De nouveaux Topics peuvent apparaître, mais seulement pour des sujets réellement distincts.

## Données Apify

Accès via le serveur MCP `apify` du projet, limité à l'actor `apify/instagram-reel-scraper`.

- Toujours activer l'option transcript (`includeTranscript: true`). Laisser désactivées les options de partages et de téléchargement de la vidéo.
- Coût : l'outil MCP ne permet pas de fixer un plafond par run. Le garde-fou est le **plafond mensuel du compte Apify (5 $)**. Ne jamais lancer l'actor sur un profil sans `resultsLimit` bas (2 ou 3). Regrouper plusieurs URL dans un même run quand c'est possible.
- Pour lire le résultat, ne demander que les champs utiles (`fields` : shortCode, url, ownerFullName, ownerUsername, timestamp, videoDuration, caption, transcript) : jamais `latestComments` ni les autres données personnelles.
- Vérifier le `shortCode` dans Notion **avant** de lancer l'actor : un Reel déjà en base ne doit pas coûter un run.

- URL : toujours reconstruite depuis `shortCode` au format `https://www.instagram.com/reel/<shortCode>/` (le champ `url` d'Apify renvoie parfois `/p/…`). Ne jamais stocker `inputUrl` (paramètres de suivi).
- Auteur : `ownerFullName`, sinon `ownerUsername`.
- Ne pas stocker `videoUrl`, `audioUrl` ni `displayUrl` (liens qui expirent), ni les likes, vues, commentaires.
- Ne collecter que ce qui sert la base (RGPD).

## Secrets

Aucun token (Apify, Notion…) dans ce dépôt, ni dans ce fichier, ni dans la doc. Les secrets restent dans la configuration locale des serveurs MCP ou dans un `.env` (ignoré par git).

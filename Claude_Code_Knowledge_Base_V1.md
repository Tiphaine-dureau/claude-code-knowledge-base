# Claude Code Knowledge Base — V1.2

> **Mise à jour V1.2 (28 septembre 2026)** : le document décrit désormais le système tel qu'il fonctionne.
>
> - **Orchestration** : Claude Code + serveurs MCP (Apify, Notion). Gumloop, devenu payant, est abandonné depuis la V1.1 (voir section 21).
> - **Alimentation** : ajout manuel des URL, par deux boîtes d'entrée (Notion et page web). La surveillance automatique de comptes est **en pause** (coût du transcript, voir section 24).
> - **Traitement** : skills `/ajouter-reel` (import) et `/publier-insights` (mise à jour de la page web), règles de décision dans `CLAUDE.md`.
> - **Consultation** : Notion, et une page web « Veille Claude Code » (artefact claude.ai) qui affiche les Insights par Topic.
> - Les noms des bases, propriétés et statuts sont les **noms exacts utilisés dans Notion**.
>
> Les sections 21 à 24 gardent l'historique des décisions et l'avancement détaillé.

## 1. 🎯 Objectif du projet

Construire une **automatisation de veille et d'apprentissage autour de Claude Code**.

L'utilisatrice repère un Reel Instagram intéressant, provenant de n'importe quel compte, et ajoute son lien. Le système récupère le contenu, l'analyse et l'intègre dans une base de connaissances structurée dans Notion, consultable aussi depuis une page web.

La surveillance automatique d'une liste de comptes (détection chaque matin des nouveaux Reels) fait partie de la conception, mais elle est **en pause** : son coût dépasse le plan gratuit d'Apify (voir section 24).

L'objectif n'est pas simplement de résumer des Reels. Le système doit progressivement construire une **base de connaissances personnelle sur Claude Code**, en reliant les sources, les sujets et les informations utiles.

### Principe général

> **Je trouve → je collecte → j'analyse → je classe → j'enrichis → je documente → je peux retrouver et réutiliser.**

---

## 2. 🔄 Les modes d'alimentation

### A. 👤 Ajout manuel (mode actuel)

L'utilisatrice ajoute l'URL d'un Reel, depuis son téléphone ou son PC, dans l'une des deux boîtes d'entrée :

- **📥 À importer** : base Notion à une seule colonne `URL`, où l'on colle le lien ;
- **bouton « + Ajouter » de la page web** : visible uniquement par la propriétaire et les éditeurs.

On peut aussi passer les liens directement à la commande : `/ajouter-reel <url> <url>`. Le traitement se lance depuis le PC ; le circuit complet est décrit en section 12.

### B. 🤖 Veille automatique (en pause)

Chaque matin, les nouveaux Reels d'une liste de comptes Instagram seraient détectés puis traités comme un ajout manuel.

Mise en pause le 28/09/2026 : 300 à 600 Reels par mois avec transcript dépassent largement le crédit gratuit d'Apify. Les pistes pour la relancer sont en section 24.

---

## 3. 🤖 Traitement par l'IA

Pour chaque Reel, Claude Code doit :

- récupérer et exploiter les informations disponibles ;
- s'appuyer sur le transcript du contenu vidéo ;
- juger si le Reel est **pertinent** (Claude Code, ou Claude utilisé pour construire quelque chose) ;
- produire une synthèse structurée ;
- identifier le sujet principal ;
- identifier les sujets ou concepts associés ;
- extraire les informations importantes ;
- identifier les Insights utiles ;
- rechercher les Topics existants qui pourraient correspondre ;
- décider s'il faut créer un nouveau Topic ou enrichir un Topic existant.

La décision doit prendre en compte **le contenu réel du Reel**, et pas uniquement son titre ou sa caption : beaucoup de captions ne contiennent qu'un appel à l'action (« commente X et je t'envoie Y en DM »).

Un Reel non pertinent n'est pas intégré à la connaissance : il est gardé en **fiche minimale** (statut `écarté`) pour ne jamais être re-scrapé.

---

## 4. 🧠 Principe central : enrichir plutôt que dupliquer

La fonction centrale de la V1 est d'éviter les doublons.

Un système naïf ferait :

```text
Reel A → Résumé A
Reel B → Résumé B
Reel C → Résumé C
```

Notre système fonctionne ainsi :

```text
Reel A
   ↓
Sujet "Skills"
   ↓
Création du Topic "Skills"


Reel B
   ↓
Sujet similaire détecté
   ↓
Enrichissement du Topic "Skills"


Reel C
   ↓
Même sujet
   ↓
Nouvel Insight
   ↓
Enrichissement du Topic
```

Un Topic devient ainsi progressivement une **synthèse de plusieurs sources**.

La même règle s'applique aux Insights : si un Reel apporte une idée déjà présente, il est **ajouté comme source** de l'Insight existant au lieu d'en créer un nouveau. Le titre de l'Insight est alors relu pour rester vrai pour toutes ses sources. C'est ce qui fait apparaître les **convergences** entre créateurs.

---

## 5. 🔍 Déduplication et rapprochement sémantique

Deux niveaux de déduplication :

1. **Reel** : un Reel est identifié par son `shortCode` (ex. `DcES6LItnCw`). Avant toute dépense Apify, la base est interrogée sur ce code ; s'il existe, quel que soit le statut (y compris `écarté`), rien n'est retraité. Jamais sur l'URL complète, dont les paramètres de suivi changent à chaque partage.
2. **Sujet** : les concepts extraits du transcript sont rapprochés des Topics existants, avec une estimation de la correspondance.

Seuils appliqués (règles détaillées dans `CLAUDE.md`) :

```text
> 85 %
   ↓
Même sujet
   ↓
Enrichir, sans demander


60–85 %
   ↓
Correspondance possible
   ↓
Demander à l'utilisatrice


< 60 %
   ↓
Sujet probablement nouveau
   ↓
Proposer la création et demander
```

Les questions sont posées **en une seule fois** pour tout un lot de Reels, avant d'écrire quoi que ce soit dans Notion.

---

## 6. 🗃️ Rôle de Notion

Notion est la **couche de stockage, de documentation et de consultation** de la V1.

La logique de traitement reste indépendante de Notion : elle vit dans `CLAUDE.md` et dans les skills du projet (voir section 15).

---

## 7. 🏗️ Architecture Notion

La page principale « Claude Code Knowledge Base » est organisée ainsi :

```text
📚 Claude Code Knowledge Base
│
├── 🗂️ Topics
├── 🎬 Reels
├── 💡 Insights
└── 📥 À importer
```

Les bases ont des rôles distincts :

```text
🎬 Reels
= les sources originales

🗂️ Topics
= les sujets / concepts

💡 Insights
= les informations utiles extraites des sources

📥 À importer
= une simple file d'attente de liens (aucune connaissance stockée)
```

Claude Code accède à Notion par une **connexion à jeton d'accès** partagée avec cette seule page : il ne voit rien d'autre de l'espace de travail.

---

## 8. 🎬 Base `Reels`

### Rôle

La base `🎬 Reels` représente les sources originales.

Chaque Reel correspond à une entrée.

### Structure

| Propriété | Type | Rôle |
|---|---|---|
| **Reel** | Title | Titre court en français, qui dit ce qu'on apprend |
| **shortCode** | Text | Identifiant unique Instagram, clé de déduplication |
| **URL** | URL | `https://www.instagram.com/reel/<shortCode>/`, sans paramètre de suivi |
| **Auteur** | Text | Créateur |
| **Date** | Date | Date de publication |
| **Date import** | Date | Date d'intégration dans la base |
| **Caption** | Text | Description Instagram, seulement si elle parle du contenu |
| **Transcript** | Text | Transcription du contenu |
| **Résumé** | Text | Synthèse du Reel (2 à 4 phrases) |
| **Sujet principal** | Select | Sujet principal identifié |
| **Topics liés** | Relation → Topics | Sujets concernés |
| **💡 Insights associés** | Relation → Insights | Informations extraites (synchronisée avec `Source`) |
| **Statut** | Select | État du traitement |

#### Sujets principaux (liste fermée)

```text
Skills
Agents
Subagents
MCP
CLAUDE.md
Context Engineering
Hooks
Workflows & automatisations
```

« Workflows & automatisations » a été ajouté le 25/09/2026 pour les automatisations construites avec Claude ou Claude Code. Un nouveau sujet n'est ajouté qu'après validation de l'utilisatrice.

#### Statuts

```text
a traiter    en attente ou en erreur (à reprendre)
en cours     traitement en cours
traité       intégré à la base
écarté       non pertinent : fiche minimale, pour ne pas le re-scraper
```

---

## 9. 🗂️ Base `Topics`

### Rôle

La base `🗂️ Topics` représente les **sujets et concepts** de la documentation.

Un Topic n'est pas une vidéo.

Plusieurs Reels peuvent alimenter le même Topic.

### Structure

| Propriété | Type | Rôle |
|---|---|---|
| **Topics** | Title | Nom du sujet |
| **▶️ Reels** | Relation → Reels | Reels qui l'alimentent (synchronisée avec `Topics liés`) |
| **💡 Insights** | Relation → Insights | Insights qui le concernent (synchronisée avec `Topics`) |

### Topics actuels

Un Topic par sujet principal de la liste fermée (section 8). La liste évolue lorsque le traitement détecte un sujet réellement distinct, après validation.

### Structure d'une page Topic

Chaque Topic est créé depuis le modèle de base « Template » et possède une page de documentation structurée :

```text
🧠 Définition

🎯 À quoi ça sert ?

⚙️ Comment ça fonctionne ?

🛠️ Mise en pratique

💡 Insights clés

🎬 Reels associés

🔗 Ressources complémentaires
```

Les sections `🎬 Reels associés` et `💡 Insights clés` utilisent des vues liées aux bases correspondantes, filtrées sur le Topic courant. Ces vues se configurent dans Notion (l'API ne permet pas de les créer).

Enrichir un Topic, c'est **ajouter sans jamais réécrire** : remplacer une phrase d'aide du modèle, ou ajouter une puce qui cite sa source (auteur, mois).

---

## 10. 💡 Base `Insights`

### Rôle

La base `💡 Insights` représente les **informations intéressantes extraites des sources**.

Un Insight correspond à ce que l'on apprend ou retient d'un ou plusieurs contenus.

### Structure

| Propriété | Type | Rôle |
|---|---|---|
| **Insight** | Title | Phrase autonome, compréhensible sans voir la vidéo |
| **Topics** | Relation → Topics | Sujet(s) concerné(s) |
| **Source** | Relation → Reels | Reel(s) à l'origine de l'information |
| **Statut** | Select | État de validation |

#### Statuts

```text
A vérifier   statut de création
A tester     à essayer en pratique
Validé       confirmé
```

Un nouvel Insight est toujours créé en `A vérifier`. Claude Code ne reformule automatiquement que les Insights `A vérifier` ; pour les autres, il propose la nouvelle formulation.

---

## 11. 🔗 Modèle relationnel

La structure permet de naviguer entre les sources, les sujets et les connaissances.

```text
                 🗂️ TOPIC
                "Skills"
                  ▲  ▲
                  │  │
          ┌───────┘  └───────┐
          │                  │
          │                  │
       🎬 REEL ───────────→ 💡 INSIGHT
```

Un Reel peut être associé à plusieurs Topics et produire plusieurs Insights.

Un Insight peut être relié à un ou plusieurs Topics et à un ou plusieurs Reels.

Exemple réel (septembre 2026) :

```text
🎬 Reel Zeyneb Madi       ──┐
🎬 Reel Ugo Tatas         ──┤
🎬 Reel Jean-Baptiste Roy ──┼──→ 💡 « La skill Superpowers impose à Claude une méthode de développeur… »
🎬 Reel Eric Djavid       ──┘          │
                                       ▼
                                  🗂️ Skills
```

Cette structure permet de faire apparaître les **convergences** entre créateurs : la page web affiche un badge « 4 créateurs » sur cet Insight.

---

## 12. 🧩 Fonctionnement global de la V1

```text
                  👀 VEILLE
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Comptes surveillés      URL manuelle
      (en pause)        (📥 Notion · page web)
          │                     │
          └──────────┬──────────┘
                     ▼
            DÉDUPLICATION (shortCode)
                     │
                     ▼
         🎬 CONTENU + TRANSCRIPTION (Apify)
                     │
                     ▼
                🤖 ANALYSE IA
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Résumé     Topics     Insights
                     │
                     ▼
             RAPPROCHEMENT SÉMANTIQUE
                     │
             ┌───────┴───────┐
             ▼               ▼
      Sujet existant     Nouveau sujet
             │          (après validation)
             ▼               ▼
       Enrichissement      Création
             │               │
             └───────┬───────┘
                     ▼
                  🗃️ NOTION
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Reels      Topics     Insights
                     │
                     ▼
            🌐 PAGE WEB (lecture)
```

---

## 13. 🔄 Exemple complet

Imaginons qu'un Reel explique une bonne pratique concernant les Skills.

### Étape 1 — Entrée

```text
Instagram Reel
        ↓
URL collée dans une boîte d'entrée
```

### Étape 2 — Analyse

Claude Code récupère (via Apify) puis produit :

```text
Auteur
Date
Caption (si utile)
Transcript
Résumé
Concepts
Insights
```

### Étape 3 — Classification

Claude Code identifie :

```text
Sujet principal → Skills
```

### Étape 4 — Recherche

Il vérifie si un Topic `Skills` existe déjà, et si un Insight porte déjà la même idée.

```text
Skills existe
     ↓
Correspondance suffisante
     ↓
Enrichir le Topic
```

### Étape 5 — Stockage

Notion reçoit :

```text
🎬 Reel
   │
   ├── Topics liés → Skills
   │
   └── 💡 Insights associés → Insight X (nouveau ou existant)
```

La page du Topic `Skills` est enrichie (sections décrites en section 9) et affiche le nouveau Reel et l'Insight dans ses vues liées.

### Étape 6 — Consultation

La page web est republiée : l'Insight apparaît sous le Topic Skills, avec le résumé du Reel et le lien vers la vidéo.

---

## 14. 🛠️ Architecture technique V1

### Orchestration

**Claude Code + serveurs MCP**, déclarés dans le `.mcp.json` du projet (voir section 21) :

- `notion` : serveur officiel `@notionhq/notion-mcp-server`, jeton lu dans la variable d'environnement `NOTION_TOKEN` ;
- `apify` : serveur officiel `@apify/actors-mcp-server`, limité à l'actor `apify/instagram-reel-scraper`, jeton lu dans `APIFY_TOKEN`.

Les règles de décision sont dans `CLAUDE.md`, les procédures dans deux skills versionnées :

| Skill | Rôle |
|---|---|
| `/ajouter-reel` | Lit les boîtes d'entrée (ou les URL passées en argument), déduplique, lance Apify en un seul run, analyse, pose les questions groupées, écrit dans Notion, vide les boîtes, republie la page web, rend compte |
| `/publier-insights` | Relit Notion (Topics, Insights, Reels traités), régénère les données de la page web et la republie à la même adresse |

### Récupération Instagram

**Apify**, actor officiel `apify/instagram-reel-scraper`, option transcript activée (voir section 22). Un seul run par lot de Reels ; champs lus et correspondance avec Notion en section 22.

### Interface web

Page « Veille Claude Code », publiée comme artefact claude.ai (privée, partageable par invitation) :

- affiche les Insights groupés par Topic, triés par convergence, avec le résumé des Reels sources ;
- mobile d'abord : onglets, cartes, accordéons, pas de tableau ;
- bouton « + Ajouter » (propriétaire et éditeurs) qui alimente une file d'attente dans la base de données de l'artefact ;
- code dans `interface/` : HTML, CSS natif, JavaScript en modules ES typés en JSDoc, tests unitaires de la logique pure (`npm test`).

---

## 15. 🧱 Principe d'indépendance de Notion

Notion ne doit pas devenir le cœur logique du système.

```text
CLAUDE CODE (CLAUDE.md + skills)
────────────────────────────────
🧠 Logique
🔍 Recherche
🤖 IA
🔄 Automatisation
🧹 Déduplication
📊 Classification


NOTION
──────────────
🗃️ Stockage
📖 Documentation
👀 Consultation
✏️ Modification manuelle
🔗 Relations
```

La logique métier peut évoluer indépendamment de la solution de stockage. La page web lit un export des données (`data.json`), pas Notion directement.

---

## 16. 🗺️ Feuille de route d'implémentation

### Phase 1 — Notion

Créer les bases, leurs propriétés, relations, modèles et vues liées, pour naviguer entre les sources, les sujets et les Insights.

✅ **Terminée** (sections 7 à 11).

---

### Phase 2 — Premier traitement manuel

Tester le système avec une seule URL de Reel, de la récupération jusqu'à Notion.

✅ **Terminée** (25/09/2026) : chaîne Apify → Claude Code → Notion validée de bout en bout, déduplication par `shortCode` comprise.

---

### Phase 3 — Déduplication

Tester plusieurs Reels parlant du même sujet (principe de la section 4).

✅ **Terminée** (25/09/2026) : les Reels d'un même sujet enrichissent le même Topic, et une idée déjà présente reçoit une source de plus. Les convergences sont apparues au lot du 28/09 (Superpowers et la mémoire entre les sessions : 4 créateurs chacun).

---

### Phase 4 — Surveillance automatique

Surveiller une liste de comptes, détecter chaque matin les nouveaux Reels et les traiter automatiquement.

⏸️ **En pause** (28/09/2026), voir section 2 B et section 24.

---

### Phase 5 — Amélioration

🟡 **Amorcée** : interface de consultation et convergences visibles (page web). Reste à ajouter progressivement les évolutions de la section 18, avec une classification et une déduplication affinées à l'usage.

---

## 17. 🔮 Vision à long terme

La V1 actuelle (Instagram → Apify → Claude Code → Notion → page web, section 12) pourra évoluer vers :

```text
Instagram / autres sources
            ↓
       Ingestion layer
            ↓
     Transcription / OCR
            ↓
         LLM / Agents
            ↓
   Classification sémantique
            ↓
     Base de connaissances
            ↓
    ┌───────┴────────┐
    ↓                ↓
 Notion           Obsidian
    │                │
    └───────┬────────┘
            ↓
     Interface dédiée
```

L'objectif est de pouvoir remplacer la couche de stockage sans refaire toute la logique d'analyse. L'« interface dédiée » existe déjà sous une première forme : la page web.

---

## 18. 🚀 Évolutions possibles après la V1

Ces fonctionnalités sont hors périmètre de la première version, mais l'architecture doit permettre de les ajouter progressivement.

### 🔥 Digest périodique

```text
Cette semaine

5 nouveaux sujets
12 nouvelles sources
8 nouveaux Insights

🔥 Sujet le plus discuté :
Claude Code Skills — 7 sources

⚠️ Information contradictoire :
Subagents — 2 avis différents
```

### 🔎 Convergences

Identifier les recommandations mentionnées par plusieurs créateurs. Première version en place : tri et badge « N créateurs » sur la page web.

### ⚠️ Contradictions

Identifier les affirmations qui se contredisent et, à terme, les confronter à des sources fiables ou officielles.

### 📈 Tendances

Identifier les sujets devenant de plus en plus présents dans les contenus ajoutés.

### 🛠️ Suggestions d'action

Transformer une information en proposition concrète :

```text
Plusieurs sources recommandent cette approche.

→ Tu pourrais créer un Skill `code-review`
  dans ton projet.
```

### 🤖 Assistant de recherche

Permettre de poser des questions sur l'ensemble de la base :

> « Qu'ai-je appris sur les Skills ? »

> « Quels sont les points communs entre les différents créateurs ? »

> « Quelles techniques devrais-je essayer dans mon projet ? »

---

## 19. 🏆 Critère de réussite de la V1

La V1 ne doit pas chercher à être un système d'IA complexe.

Le critère de réussite est simple :

> **Je trouve un Reel intéressant → je l'ajoute → le contenu est analysé → l'information est intégrée proprement à ma base de connaissances → sans créer de doublon inutile.**

Le système doit progressivement transformer :

```text
        📱 VEILLE INSTAGRAM
               ↓
          🎬 REELS
               ↓
           🤖 IA
               ↓
      🗂️ TOPICS + 💡 INSIGHTS
               ↓
      📖 CONNAISSANCE CLAUDE CODE
               ↓
          🛠️ APPRENTISSAGE
```

---

## 20. 🧭 Principe directeur

Le projet n'est pas une simple bibliothèque de vidéos.

C'est un système dont la fonction est de transformer une **veille continue** en **connaissance structurée et réutilisable**.

```text
         SOURCES
            │
            ▼
       INFORMATION
            │
            ▼
        CONNAISSANCE
            │
            ▼
          ACTION
```

À terme, l'ambition est de passer d'une simple collecte de contenu à un véritable **agent de veille et d'apprentissage Claude Code**, capable de faire émerger les concepts importants, les bonnes pratiques, les techniques concrètes, les convergences, les contradictions et les idées à tester.

Cette vision reste volontairement **hors périmètre de la V1**.

---

## 21. 🔀 Changement de cap : abandon de Gumloop

### Contexte

Gumloop, l'outil d'orchestration prévu dans la première conception, est devenu payant. L'objectif du projet étant de **payer le moins possible**, l'orchestration a été déplacée vers Claude.

Tout ce que la conception initiale confiait à Gumloop (récupération, transcription, appel au LLM, déduplication, écriture dans Notion, planification) est désormais pris en charge par la solution retenue ci-dessous.

### Solutions envisagées

| Solution | Principe | Coût | Avantages | Limites |
|---|---|---|---|---|
| **Gumloop (payant)** | Conception initiale | Abonnement | Déjà spécifié | Payant : contraire à l'objectif de coût minimal |
| **Script Python + API Anthropic** | Script écrit avec l'aide de Claude, qui appelle l'API pour l'analyse | Clé API facturée à l'usage, en plus de l'abonnement | Déterministe, facile à planifier | Plus de mise en place, gestion d'une clé API |
| **Claude Code + serveurs MCP (Apify, Notion)** | Claude Code lance Apify, analyse le contenu et écrit directement dans Notion | Inclus dans l'abonnement Claude, **aucune clé API** | Peu de code, résultat visible dans Notion à chaque étape, transformable en **skill** | Soumis aux plafonds d'usage de l'abonnement ; écritures moins prévisibles qu'un script figé |

### ✅ Solution retenue

**Claude Code connecté à Apify et à Notion (serveurs MCP)**, avec la procédure transformée en **skills** (`/ajouter-reel`, puis `/publier-insights`).

Raisons :

- pas de clé API Anthropic à payer en plus ;
- adapté à un premier projet avec Claude Code : moins de code à déboguer ;
- a permis de valider les phases 2 et 3 (une URL, puis déduplication) avant de figer une architecture ;
- respecte le principe d'indépendance de Notion (section 15) : les règles de classification et de déduplication vivent dans `CLAUDE.md` et les skills, pas dans Notion.

Le fonctionnement qui en découle est décrit en section 12, l'architecture technique en section 14.

---

## 22. 🛰️ Récupération Instagram : Apify retenu

### Comparaison des options

| | **Apify** | **Bright Data** | **yt-dlp** |
|---|---|---|---|
| Plan gratuit | 5 $ de crédit par mois, sans carte bancaire | 5 000 crédits par mois (environ 7,50 $), sans carte bancaire | Gratuit |
| Volume gratuit annoncé | Environ 1 900 Reels par mois sans option (2,60 $ / 1 000 résultats sur l'actor officiel) | Jusqu'à 5 000 enregistrements par mois | Illimité |
| Report du crédit non utilisé | Non | Non | Sans objet |
| Crédit épuisé | Les runs sont bloqués jusqu'au cycle suivant, sans dépassement facturé | Erreur tant qu'aucun fonds n'est déposé, jusqu'au renouvellement | Sans objet |
| Fiabilité sur Instagram | Bonne (actor maintenu par Apify) | Bonne | Fragile : souvent bloqué sans cookies de connexion |
| Transcript fourni | Oui, en option payante | Non | Non (à coupler à une transcription locale) |

Les tarifs et quotas évoluent : les revérifier avant tout changement de plan.

**Choix : Apify**, avec l'actor officiel `apify/instagram-reel-scraper`.

### Tests réalisés le 19/09/2026

Reel de test : publication de `zeyneb_madi` (code `DcES6LItnCw`, 30 secondes). Sa caption ne contient que « Commente Claude et je t'envoie la skill en DM » : **la caption seule est inexploitable**, ce qui confirme qu'il faut analyser le contenu réel de la vidéo (principe de la section 3).

| | Sans transcript | Avec transcript |
|---|---|---|
| Coût du run (1 Reel) | **0,004 $** | **0,052 $** |
| Durée du run | 6 s | 8 s |
| Transcript dans le JSON | Non | Oui (champ `transcript`) |
| Nombre de Reels avec les 5 $ gratuits | Environ 1 250 | Environ 95 |

Constats :

- le transcript est en français, complet et fidèle ; quelques erreurs mineures de reconnaissance (noms propres, « Claude Code » transcrit « CloudCode »), sans conséquence pour l'analyse ;
- le supplément dû à l'option transcript est facturé à la minute d'audio : un Reel plus long coûte plus cher ;
- un run à 1 résultat coûte un peu plus que le tarif unitaire annoncé (coût fixe par run) : depuis le 25/09, les Reels sont **regroupés dans un seul run par lot**.

Usage réel depuis : environ 0,05 à 0,10 $ par Reel selon sa durée (estimation, le coût exact est visible dans la console Apify).

### ✅ Décision

**Rester sur Apify avec l'option « Include transcript » activée**. Un volume de **90 à 95 Reels par mois** est suffisant pour l'ajout manuel et tient dans le crédit gratuit. Le garde-fou est le **plafond mensuel de 5 $** fixé sur le compte Apify (le serveur MCP ne permet pas de plafond par run).

Écartées pour l'instant :

- les options « Include shares count » (sans intérêt pour la base) et « Include downloaded video » (inutile, on n'a pas besoin de conserver la vidéo) ;
- **la transcription locale** (yt-dlp pour télécharger, Whisper pour transcrire) : gratuite à grande échelle, mais demande une installation. Reste l'option de repli si le coût du transcript Apify devient un problème (voir section 24).

### Champs utiles du JSON et correspondance avec Notion

Seuls ces champs sont lus : `shortCode`, `ownerFullName`, `ownerUsername`, `timestamp`, `videoDuration`, `caption`, `transcript`.

| Propriété Notion (base 🎬 Reels) | Source |
|---|---|
| **shortCode** | `shortCode` |
| **URL** | Toujours reconstruite : `https://www.instagram.com/reel/<shortCode>/` (le champ `url` renvoie parfois `/p/…` ; ne jamais stocker `inputUrl`, qui contient des paramètres de suivi) |
| **Auteur** | `ownerFullName`, avec `ownerUsername` en secours |
| **Date** | `timestamp` |
| **Date import** | Date du jour, générée à l'exécution |
| **Caption** | `caption`, seulement si elle parle du contenu du Reel |
| **Transcript** | `transcript`, découpé en blocs de 2000 caractères maximum (limite Notion) |
| **Reel** (titre) | Absent des données : titre court généré par Claude à partir du transcript |
| **Résumé** | Généré par Claude |
| **Sujet principal** | Choisi par Claude dans la liste fermée de la section 8 |
| **Topics liés** | Décision de Claude après recherche parmi les Topics existants |
| **💡 Insights associés** | Insights créés (statut `A vérifier`) ou existants auxquels le Reel est ajouté comme source |
| **Statut** | `traité` en fin de traitement (`écarté` si non pertinent) |

### Exemple de sortie d'analyse (Reel de test)

```json
{
  "titre": "Publier sur Instagram depuis Claude avec une skill",
  "pertinent": true,
  "resume": "Présentation d'une skill qui permet à Claude de publier directement sur Instagram, pour automatiser un calendrier éditorial (scripts, création vidéo, publication de reels, carousels et posts, programmation sur une semaine ou un mois).",
  "sujet_principal": "Skills",
  "topics": [{"nom": "Skills", "action": "enrichir", "confiance": 0.9}],
  "insights": [
    "Une skill peut connecter Claude à Instagram pour publier sans quitter Claude.",
    "Un outil de génération vidéo peut être associé pour automatiser la création des vidéos."
  ]
}
```

Un Reel jugé non pertinent (`pertinent: false`) est gardé en fiche minimale avec le statut `écarté` : titre, shortCode, URL, auteur, dates, et la raison de l'écart dans le Résumé.

### Points d'attention

- Les liens `videoUrl`, `audioUrl` et `displayUrl` d'Instagram expirent : ne pas les stocker.
- Le nombre de commentaires, de likes ou de vues ne sert pas la base de connaissances : ne pas l'importer.
- Nombreux Reels « commente X pour recevoir Y en DM » : la valeur est dans la vidéo, pas dans la caption.
- Le token Apify est un secret : il reste dans la variable d'environnement `APIFY_TOKEN`, jamais dans un document ou dans le dépôt.
- Apify a proposé de partager les runs de l'actor avec son développeur (réglable dans Settings > Privacy) : décision à prendre.
- Le scraper ne lit que des contenus publics. Les données personnelles publiques restent soumises au RGPD : ne collecter que ce qui sert la base de connaissances.

---

## 23. 🧭 Étapes de réalisation, en détail

### Étape 0 : Prérequis

- [x] Prendre l'abonnement incluant **Claude Code** et l'installer (application de bureau, onglet Code).
- [x] Vérifier que le compte **Apify** est prêt, avec son token personnel (Settings > API & Integrations).
- [x] Vérifier l'accès à la page Notion « Claude Code Knowledge Base » et à ses trois bases.

### Étape 1 : Préparer le projet Claude Code

- [x] Créer un dossier dédié `claude-code-knowledge-base`, versionné sur GitHub (dépôt privé).
- [x] Y déposer ce document : il sert de contexte permanent au projet.
- [x] Créer un fichier `CLAUDE.md` court qui résume : l'objectif, les bases Notion et leurs propriétés, la liste fermée des sujets principaux, les statuts, et la règle « enrichir plutôt que dupliquer ».
- [x] Ne rien y écrire de secret (pas de token).

### Étape 2 : Connecter Notion

- [x] Créer une connexion Notion par **jeton d'accès** (et non le connecteur officiel en OAuth, qui donne accès à tout l'espace de travail), puis déclarer le serveur MCP `@notionhq/notion-mcp-server` dans `.mcp.json`, avec le jeton lu depuis la variable d'environnement `NOTION_TOKEN`.
- [x] **Partager la page « Claude Code Knowledge Base » avec la connexion** : sans cela, les bases restent invisibles.
- [x] Aligner `CLAUDE.md` sur les noms exacts des propriétés et statuts Notion ; ajouter la propriété `shortCode` à 🎬 Reels.
- [x] Contrôle : demander à Claude Code de lister les bases et leurs propriétés.

### Étape 3 : Connecter Apify

- [x] Ajouter le serveur MCP d'Apify (`@apify/actors-mcp-server`), limité à l'actor `apify/instagram-reel-scraper`, avec le token lu depuis `APIFY_TOKEN`.
- [x] Fixer un **plafond de coût** : le serveur MCP ne permet pas de plafond par run, le garde-fou est donc le plafond mensuel du compte Apify (5 $, Settings > Usage & billing).
- [x] Contrôle : lancer l'actor sur une seule URL, option transcript activée, et vérifier que le JSON revient avec le champ `transcript`.

### Étape 4 : Test 1, écriture Notion

> Réalisée le 25/09/2026 avec un vrai Reel (`DYh3sFeotZD`) au lieu de données factices : création du Reel, d'un nouveau Topic « Workflows & automatisations » depuis le modèle, de deux Insights et des relations.

- [x] Créer une page Reel dans 🎬 Reels, avec toutes les propriétés remplies.
- [x] Créer des Insights reliés à ce Reel et à un Topic.
- [x] Vérifier dans Notion : les relations, les statuts, les types de propriétés (Select, Date, URL).
- [x] Supprimer les anciennes données de test.

### Étape 5 : Test 2, le Reel de test de bout en bout (phase 2)

> Réalisée le 25/09/2026. Test de doublon avec l'URL contenant les paramètres de suivi : shortCode trouvé dans Notion avant tout appel à Apify, rien recréé, aucun coût.

- [x] Fournir l'URL du Reel de test (`DcES6LItnCw`).
- [x] Claude Code : récupère via Apify, analyse (titre, pertinence, résumé, sujet principal, topics, insights), vérifie que le `shortCode` n'existe pas déjà dans 🎬 Reels, puis crée le Reel, les Insights et les relations.
- [x] Vérifier chaque champ dans Notion, en particulier : sujet principal = Skills, Topic lié = Skills, Insights en `A vérifier`, statut du Reel = `traité`.
- [x] Relancer la même URL : le système doit reconnaître le doublon et **ne rien recréer**.

### Étape 6 : Formaliser les règles de classification et de déduplication

- [x] Écrire dans `CLAUDE.md` les règles de décision, avec les seuils de la section 5 (plus de 85 % : enrichir ; 60 à 85 % : demander ; moins de 60 % : proposer un nouveau Topic).
- [x] Préciser la marche à suivre pour une correspondance incertaine : questions groupées, avant toute écriture.
- [x] Préciser ce que veut dire « enrichir » : ajouter des éléments aux sections du Topic et de nouveaux Insights, sans réécrire l'existant ; ajouter une source à un Insight existant quand l'idée est la même, puis relire son titre.
- [x] Préciser le traitement d'un Reel non pertinent : fiche minimale en statut `écarté`, pour ne jamais relancer Apify dessus.
- [x] Préciser la caption (stockée seulement si elle parle du contenu) et les contraintes techniques Notion (blocs de 2000 caractères, noms de fichiers en format code).

### Étape 7 : Phase 3, tester la déduplication

> 25/09/2026, premier lot de 7 Reels : 4 traités, 1 enrichissement sur un même Topic (Agents, deux Reels sur les loops : l'Insight commun a reçu les deux sources au lieu d'être dupliqué), 2 écartés. Le cas « plusieurs créateurs sur un même sujet » s'est vérifié au lot du 28/09 (Superpowers et la mémoire entre les sessions : 4 créateurs chacun).

- [x] Traiter plusieurs Reels sur le même sujet.
- [x] Vérifier : le premier crée ou complète le Topic, les suivants l'enrichissent, sans doublon, avec de nouveaux Insights pertinents.
- [x] Ajuster les instructions selon les erreurs constatées.

### Étape 8 : Créer les skills

- [x] `/ajouter-reel` : entrée = des URL ou les boîtes d'entrée, sortie = un compte rendu de ce qui a été créé, enrichi ou écarté dans Notion.
- [x] `/publier-insights` : régénère les données de la page web depuis Notion et la republie ; appelée automatiquement à la fin de `/ajouter-reel` quand un import change quelque chose.
- [x] Garder les skills dans le dossier du projet (`.claude/skills/`) pour les versionner.

### Étape 9 : Phase 4, surveillance automatique (en pause)

> **28/09/2026 : phase mise en pause** (coût du transcript, section 24), remplacée par l'ajout manuel via deux boîtes d'entrée : 📥 À importer dans Notion, et le bouton « + Ajouter » de la page web (section 2 A). `/ajouter-reel` sans argument lit les deux, fusionne les doublons, traite tout en un seul run Apify, puis les vide.

- [ ] Établir la liste des comptes surveillés (une dizaine).
- [ ] Limiter chaque run aux **2 ou 3 derniers Reels** (ou aux Reels de moins de 24 h avec le filtre de date de l'actor) : le coût dépend du nombre de résultats renvoyés, pas du nombre de comptes.
- [x] Ignorer tout Reel dont le `shortCode` existe déjà dans la base, y compris les Reels `écarté` (fait par `/ajouter-reel`).
- [x] Gestion d'erreur : un Reel qui échoue reste au statut `a traiter` au lieu d'être perdu (fait par `/ajouter-reel`).
- [ ] Choisir le mode d'exécution planifiée (section 24).
- [ ] Trancher la question du **coût du transcript** (section 24).

### Étape 10 : Interface web

> Réalisée le 28/09/2026 : page « Veille Claude Code » publiée comme artefact claude.ai, privée, partageable par invitation.

- [x] Afficher les Insights par Topic, triés par convergence, avec le résumé des Reels sources ; onglet Reels ; recherche.
- [x] Concevoir mobile d'abord : onglets, cartes, accordéons, filtres par Topic qui défilent au doigt ou passent à la ligne à la souris.
- [x] Ajouter le bouton « + Ajouter » (file d'attente dans la base de données de l'artefact, réservée aux éditeurs, droits vérifiés).
- [x] Séparer le code (HTML, CSS, JavaScript en modules), tester la logique pure (`cd interface && npm test`).

### Étape 11 : Phase 5, amélioration

Voir section 16 (état) et section 18 (évolutions possibles).

---

## 24. ⚖️ Points de décision à trancher plus tard

### Coût du transcript en surveillance automatique

Le crédit gratuit couvre environ **50 à 95 Reels par mois** avec transcript (coûts en section 22), suffisant pour l'ajout manuel. La surveillance de 10 comptes à raison de 1 à 2 Reels par jour représenterait **300 à 600 Reels par mois**. Avant de relancer la phase 4, choisir entre :

| Piste | Principe | Compromis |
|---|---|---|
| Filtrer avant de transcrire | Récupérer d'abord les Reels sans transcript (environ 0,004 $ chacun) et ne demander le transcript que pour ceux jugés prometteurs | Le tri sur la caption seule est peu fiable (voir le Reel de test) |
| Transcription locale | Télécharger les vidéos avec yt-dlp et les transcrire gratuitement avec Whisper (approche décrite dans le Reel « Reels Vault » de madamet3ch) | Installation et maintenance ; yt-dlp peut être bloqué par Instagram |
| Passer à un plan payant d'Apify | Plus de crédit et tarifs dégressifs | Coût mensuel |
| Réduire le nombre de comptes ou de Reels | Ne suivre que les comptes les plus utiles | Veille moins large |

### Lancer le traitement sans être devant le PC

Les URL s'ajoutent depuis le téléphone, mais `/ajouter-reel` se lance depuis le PC. Deux pistes, sans coût supplémentaire (incluses dans l'abonnement, l'usage compte dans les limites habituelles) :

| Piste | Principe | Compromis |
|---|---|---|
| **Remote Control** | Piloter depuis l'application Claude du téléphone une session qui tourne sur le PC | Aucune configuration, mais le PC doit rester allumé avec une session ouverte. Peu utile tant que le PC est éteint en journée |
| **Session cloud / Routine** | Session Claude Code sur les serveurs d'Anthropic, lancée depuis le téléphone ou à heure fixe (Routine, par exemple chaque soir) : fonctionne PC éteint | À configurer : jetons Notion et Apify dans l'environnement cloud (de préférence en « API credentials »), domaines `api.notion.com` et `api.apify.com` à autoriser, serveurs MCP de `.mcp.json` à tester. Une Routine tourne sans utilisateur : les Reels incertains doivent rester dans la boîte d'entrée jusqu'à la session suivante |

Test conseillé avant de choisir le cloud : configurer l'environnement puis lancer `/ajouter-reel` sur un Reel déjà en base (vérifie Notion sans dépense Apify).

### Une seule boîte d'entrée

La boîte Notion « 📥 À importer » et le bouton « + Ajouter » de la page web coexistent. Garder celle qui s'avère la plus pratique à l'usage et supprimer l'autre (base Notion, ou collection `inbox` et bouton de la page).

### Partage de la page web

La page est privée. Comme elle utilise une base de données (file d'attente), elle ne peut être partagée que par invitation, pas par lien public. Si un partage large devient utile, il faudrait retirer le bouton « + Ajouter » de la version partagée.

### Plafonds d'usage de Claude Code

Vérifier sur la durée la consommation de l'abonnement pour le traitement de lots de Reels, surtout avant toute exécution automatique.

### Partage des runs Apify

Décider d'accepter ou non le partage des runs de l'actor avec son développeur.

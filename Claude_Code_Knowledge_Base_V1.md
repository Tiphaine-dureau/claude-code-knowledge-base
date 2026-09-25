# Claude Code Knowledge Base — V1.1

> **Mise à jour V1.1 (19 septembre 2026)** : Gumloop est devenu payant et n'est plus utilisé. Partout où ce document mentionne « Gumloop », lire « couche d'orchestration » : **Claude Code + connecteurs MCP (Apify, Notion)**. La récupération des Reels se fait avec **Apify**. Voir les sections **21 à 24** en fin de document (décisions, tests, étapes suivantes). Le reste de la conception V1 est inchangé.

## 1. 🎯 Objectif du projet

Construire une **automatisation de veille et d'apprentissage autour de Claude Code**.

Chaque matin, le système doit pouvoir surveiller une liste de comptes Instagram, détecter les nouveaux Reels et les intégrer automatiquement dans une base de connaissances structurée dans Notion.

L'utilisateur doit également pouvoir ajouter manuellement l'URL d'un Reel intéressant provenant de n'importe quel compte.

L'objectif n'est pas simplement de résumer des Reels. Le système doit progressivement construire une **base de connaissances personnelle sur Claude Code**, en reliant les sources, les sujets et les informations utiles.

### Principe général

> **Je trouve → je collecte → j'analyse → je classe → j'enrichis → je documente → je peux retrouver et réutiliser.**

---

## 2. 🔄 Les deux modes d'alimentation

### A. 🤖 Veille automatique

Une liste de comptes Instagram est définie.

Chaque matin, Gumloop lance automatiquement le workflow :

```text
Comptes surveillés
        │
        ▼
Recherche des nouveaux Reels
        │
        ▼
Identification des contenus non traités
        │
        ▼
Traitement
```

### B. 👤 Ajout manuel

L'utilisateur peut fournir directement l'URL d'un Reel.

```text
URL du Reel
     ↓
Récupération
     ↓
Transcription
     ↓
Analyse IA
     ↓
Classement
     ↓
Notion
```

Le Reel peut provenir d'un compte qui n'est pas surveillé automatiquement.

---

## 3. 🤖 Traitement par l'IA

Pour chaque Reel, l'IA doit :

- récupérer et exploiter les informations disponibles ;
- analyser ou transcrire le contenu vidéo ;
- produire une synthèse structurée ;
- identifier le sujet principal ;
- identifier les sujets ou concepts associés ;
- extraire les informations importantes ;
- identifier les Insights utiles ;
- rechercher les Topics existants qui pourraient correspondre ;
- décider s'il faut créer un nouveau Topic ou enrichir un Topic existant.

La décision doit prendre en compte **le contenu réel du Reel**, et pas uniquement son titre ou sa caption.

---

## 4. 🧠 Principe central : enrichir plutôt que dupliquer

La fonction centrale de la V1 est d'éviter les doublons.

Un système naïf ferait :

```text
Reel A → Résumé A
Reel B → Résumé B
Reel C → Résumé C
```

Notre système doit fonctionner ainsi :

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

---

## 5. 🔍 Déduplication et recherche sémantique

Lorsqu'un nouveau Reel arrive :

```text
Nouveau Reel
     │
     ▼
Transcription / contenu
     │
     ▼
Analyse LLM
     │
     ▼
Extraction des concepts
     │
     ▼
Recherche parmi les Topics existants
     │
     ▼
Score de similarité
```

Première logique envisagée :

```text
> 85 %
   ↓
Topic probablement identique
   ↓
Enrichir


60–85 %
   ↓
Correspondance possible
   ↓
À vérifier


< 60 %
   ↓
Sujet probablement nouveau
   ↓
Créer un Topic
```

Les seuils sont indicatifs et pourront être ajustés pendant les tests.

La déduplication doit être sémantique et prendre en compte le contenu analysé du Reel.

---

## 6. 🗃️ Rôle de Notion

Notion est la **couche de stockage, de documentation et de consultation** de la V1.

La logique de traitement doit rester autant que possible indépendante de Notion.

```text
                 INSTAGRAM
                     │
        ┌────────────┴────────────┐
        │                         │
 Comptes surveillés        Ajout manuel
        │                         │
        └────────────┬────────────┘
                     ▼
                  GUMLOOP
                     │
              récupération
                     │
              transcription
                     │
                     ▼
                   LLM
                     │
            analyse / classement
                     │
            déduplication
                     │
                     ▼
                  NOTION
```

Cette séparation permettra plus tard de remplacer Notion par une autre solution sans refaire toute la logique d'analyse.

---

# 7. 🏗️ Architecture Notion

L'espace principal est organisé ainsi :

```text
📚 CLAUDE CODE
│
├── 📚 Topics
├── 🎬 Reels
└── 💡 Insights
```

Les trois bases ont des rôles distincts :

```text
🎬 Reels
= les sources originales

📚 Topics
= les sujets / concepts

💡 Insights
= les informations utiles extraites des sources
```

---

# 8. 🎬 Base `Reels`

## Rôle

La base `🎬 Reels` représente les sources originales.

Chaque Reel correspond à une entrée.

## Structure finale

| Propriété | Type | Rôle |
|---|---|---|
| **Reel** | Title | Nom du Reel |
| **URL** | URL | Source Instagram |
| **Auteur** | Text | Créateur |
| **Date** | Date | Date de publication |
| **Date d'import** | Date | Date d'intégration dans la base |
| **Caption** | Text | Description Instagram |
| **Transcript** | Text | Transcription du contenu |
| **Résumé** | Text | Synthèse du Reel |
| **Sujet principal** | Select | Sujet principal identifié |
| **Topics liés** | Relation → Topics | Sujets concernés |
| **Insights associés** | Relation → Insights | Informations extraites |
| **Statut** | Select | État du traitement |

### Sujets principaux

```text
Skills
Agents
Subagents
MCP
CLAUDE.md
Context engineering
Hooks
```

### Statuts

```text
🔴 À traiter
🟡 En cours
🟢 Traité
```

---

# 9. 📚 Base `Topics`

## Rôle

La base `📚 Topics` représente les **sujets et concepts** de la documentation.

Un Topic n'est pas une vidéo.

Plusieurs Reels peuvent alimenter le même Topic.

## Topics de départ

```text
Skills
Agents
Subagents
MCP
CLAUDE.md
Context engineering
Hooks
```

La liste pourra évoluer lorsque l'automatisation détectera de nouveaux sujets réellement distincts.

## Structure d'un Topic

Chaque Topic possède une page de documentation structurée :

```text
🧠 Définition

🎯 À quoi ça sert ?

⚙️ Comment ça fonctionne ?

🛠️ Mise en pratique

💡 Insights clés

🎬 Reels associés

🔗 Ressources complémentaires
```

Les sections `🎬 Reels associés` et `💡 Insights clés` utilisent des vues liées aux bases correspondantes, filtrées sur le Topic courant.

---

# 10. 💡 Base `Insights`

## Rôle

La base `💡 Insights` représente les **informations intéressantes extraites des sources**.

Un Insight correspond à ce que l'on apprend ou retient d'un ou plusieurs contenus.

## Structure finale

| Propriété | Type | Rôle |
|---|---|---|
| **Insight** | Title | Information ou idée importante |
| **Topic** | Relation → Topics | Sujet concerné |
| **Source** | Relation → Reels | Reel(s) à l'origine de l'information |
| **Statut** | Select | État de validation |

### Statuts

```text
🔴 À vérifier
🟡 À tester
🟢 Validé
```

---

# 11. 🔗 Modèle relationnel

La structure permet de naviguer entre les sources, les sujets et les connaissances.

```text
                 📚 TOPIC
                "Skills"
                  ▲  ▲
                  │  │
          ┌───────┘  └───────┐
          │                  │
          │                  │
       🎬 REEL ───────────→ 💡 INSIGHT
```

Un Reel peut être associé à plusieurs Topics et produire plusieurs Insights.

Un Insight peut être relié à un Topic et à un ou plusieurs Reels.

Exemple :

```text
🎬 Reel A ──┐
🎬 Reel B ──┼──→ 💡 Insight
🎬 Reel C ──┘          │
                       ▼
                  📚 Skills
```

Cette structure permet notamment de préparer l'analyse future des convergences entre plusieurs créateurs.

---

# 12. 🧩 Fonctionnement global de la V1

```text
                  👀 VEILLE
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Comptes surveillés      URL manuelle
          │                     │
          └──────────┬──────────┘
                     ▼
               🎬 CONTENU
                     │
                     ▼
              TRANSCRIPTION
                     │
                     ▼
                🤖 ANALYSE IA
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Résumé     Topics     Insights
                     │
                     ▼
             RECHERCHE SÉMANTIQUE
                     │
             ┌───────┴───────┐
             ▼               ▼
      Sujet existant     Nouveau sujet
             │               │
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
```

---

# 13. 🔄 Exemple complet

Imaginons qu'un Reel explique une bonne pratique concernant les Skills.

### Étape 1 — Entrée

```text
Instagram Reel
        ↓
URL
```

### Étape 2 — Analyse

L'IA récupère notamment :

```text
Auteur
Date
Caption
Transcript
Résumé
Concepts
Insights
```

### Étape 3 — Classification

L'IA identifie :

```text
Sujet principal → Skills
```

### Étape 4 — Recherche

Elle vérifie si un Topic `Skills` existe déjà.

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
   └── Insights associés → Insight X
```

Et le Topic `Skills` devient progressivement :

```text
📚 Skills

Définition
...

Fonctionnement
...

Bonnes pratiques
...

💡 Insights clés
├── Insight X
├── Insight Y
└── Insight Z

🎬 Reels associés
├── Reel A
├── Reel B
└── Reel C
```

---

# 14. 🛠️ Architecture technique V1

## Orchestration

~~**Gumloop**~~ → **Claude Code + connecteurs MCP** (voir section 21)

La couche d'orchestration doit assurer :

- récupération des Reels ;
- traitement des données ;
- transcription ;
- appel au LLM ;
- extraction des concepts ;
- recherche de Topics similaires ;
- décision création / enrichissement ;
- création et mise à jour des données Notion ;
- automatisation planifiée.

## Instagram / récupération

Deux options sont envisagées :

### Option A — Gumloop

Utiliser les capacités/intégrations Instagram disponibles dans Gumloop.

```text
Instagram
   ↓
Gumloop
   ↓
LLM
   ↓
Notion
```

### Option B — Apify

Utiliser Apify comme couche spécialisée pour récupérer les Reels.

```text
Instagram
   ↓
Apify
   ↓
Gumloop
   ↓
LLM
   ↓
Notion
```

Le choix définitif sera fait lors de l'implémentation en fonction des possibilités réellement disponibles, des limites et du coût.

**→ Décision prise : Option B, Apify, avec l'option transcript (voir section 22).**

---

# 15. 🧱 Principe d'indépendance de Notion

Notion ne doit pas devenir le cœur logique du système.

```text
GUMLOOP
──────────────
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

La logique métier doit pouvoir évoluer indépendamment de la solution de stockage.

---

# 16. 🗺️ Feuille de route d'implémentation

## Phase 1 — Notion

✅ **Terminée** : les trois bases, leurs propriétés, relations et vues sont en place.

Mettre en place :

```text
📚 Topics
🎬 Reels
💡 Insights
```

Puis :

- définir les propriétés ;
- définir les relations ;
- créer les templates ;
- créer les vues liées ;
- permettre la navigation entre les sources, les sujets et les Insights.

---

## Phase 2 — Premier traitement manuel

🟡 **En cours** : récupération et transcript validés avec Apify ; reste la connexion à Notion et le traitement de bout en bout (voir section 23).

Tester le système avec **une seule URL de Reel**.

Objectif :

```text
URL
 ↓
Récupération
 ↓
Transcription
 ↓
Analyse IA
 ↓
Topic
 ↓
Insight
 ↓
Notion
```

Cette étape doit permettre de valider toute la chaîne avant l'automatisation.

---

## Phase 3 — Déduplication

Tester plusieurs Reels parlant du même sujet.

Objectif :

```text
Reel A
 ↓
Création Topic


Reel B
 ↓
Topic similaire détecté
 ↓
Enrichissement


Reel C
 ↓
Même Topic
 ↓
Nouvel Insight
```

---

## Phase 4 — Surveillance automatique

Ajouter :

- les comptes Instagram surveillés ;
- la récupération périodique ;
- l'exécution automatique chaque matin ;
- la détection des nouveaux Reels.

Objectif :

```text
⏰ Tous les matins
       ↓
Comptes surveillés
       ↓
Nouveaux Reels
       ↓
Workflow automatique
       ↓
Notion
```

---

## Phase 5 — Amélioration

Une fois la V1 fiable, ajouter progressivement :

- meilleure classification ;
- meilleure déduplication ;
- digest périodique ;
- détection des convergences ;
- détection des contradictions ;
- tendances ;
- recommandations d'actions ;
- assistant de recherche.

---

# 17. 🔮 Vision à long terme

La V1 :

```text
Instagram
   ↓
Gumloop / Apify
   ↓
LLM
   ↓
Notion
```

Pourra évoluer vers :

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

L'objectif est de pouvoir remplacer la couche de stockage sans refaire toute la logique d'analyse.

---

# 18. 🚀 Évolutions possibles après la V1

Ces fonctionnalités sont hors périmètre de la première version, mais l'architecture doit permettre de les ajouter progressivement.

## 🔥 Digest périodique

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

## 🔎 Convergences

Identifier les recommandations mentionnées par plusieurs créateurs.

## ⚠️ Contradictions

Identifier les affirmations qui se contredisent et, à terme, les confronter à des sources fiables ou officielles.

## 📈 Tendances

Identifier les sujets devenant de plus en plus présents dans les contenus surveillés.

## 🛠️ Suggestions d'action

Transformer une information en proposition concrète :

```text
Plusieurs sources recommandent cette approche.

→ Tu pourrais créer un Skill `code-review`
  dans ton projet.
```

## 🤖 Assistant de recherche

Permettre de poser des questions sur l'ensemble de la base :

> « Qu'ai-je appris sur les Skills ? »

> « Quels sont les points communs entre les différents créateurs ? »

> « Quelles techniques devrais-je essayer dans mon projet ? »

---

# 19. 🏆 Critère de réussite de la V1

La V1 ne doit pas chercher à être un système d'IA complexe.

Le critère de réussite est simple :

> **Je trouve un Reel intéressant → je l'ajoute, ou il est détecté automatiquement → le contenu est analysé → l'information est intégrée proprement à ma base de connaissances → sans créer de doublon inutile.**

Le système doit progressivement transformer :

```text
        📱 VEILLE INSTAGRAM
               ↓
          🎬 REELS
               ↓
           🤖 IA
               ↓
      📚 TOPICS + 💡 INSIGHTS
               ↓
      📖 CONNAISSANCE CLAUDE CODE
               ↓
          🛠️ APPRENTISSAGE
```

---

# 20. 🧭 Principe directeur

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

# 21. 🔀 Changement de cap : abandon de Gumloop

## Contexte

Gumloop est devenu payant. L'objectif du projet étant de **payer le moins possible**, l'orchestration prévue dans la V1 est déplacée vers Claude.

Tout ce que le document V1 confiait à Gumloop (récupération, transcription, appel au LLM, déduplication, écriture dans Notion, planification) est désormais pris en charge par la solution retenue ci-dessous.

## Solutions envisagées

| Solution | Principe | Coût | Avantages | Limites |
|---|---|---|---|---|
| **Gumloop (payant)** | Inchangé par rapport à la V1 | Abonnement | Déjà spécifié dans ce document | Payant : contraire à l'objectif de coût minimal |
| **Script Python + API Anthropic** | Script écrit avec l'aide de Claude, qui appelle l'API pour l'analyse | Clé API facturée à l'usage, en plus de l'abonnement (quelques centimes par Reel avec un modèle léger, à vérifier) | Déterministe, facile à planifier | Plus de mise en place, gestion d'une clé API |
| **Claude Code + connecteurs MCP (Apify, Notion)** | Claude Code lance Apify, analyse le contenu et écrit directement dans Notion | Abonnement incluant Claude Code (offre à vérifier sur le site d'Anthropic), **aucune clé API** | Peu de code, résultat visible dans Notion à chaque étape, transformable en **skill** | Soumis aux plafonds d'usage de l'abonnement ; écritures moins prévisibles qu'un script figé |

## ✅ Solution retenue

**Claude Code connecté à Apify et à Notion (serveurs MCP)**, puis transformation de la procédure en **skill** (commande du type `/ajouter-reel <url>`).

Raisons :

- pas de clé API Anthropic à payer en plus ;
- adapté à un premier projet avec Claude Code : moins de code à déboguer ;
- permet de valider les phases 2 et 3 (une URL, puis déduplication) avant de figer une architecture ;
- respecte le principe d'indépendance de Notion (section 15) : les règles de classification et de déduplication vivent dans les instructions de Claude Code (fichier `CLAUDE.md` et skill), pas dans Notion.

Pour la phase 4 (exécution automatique chaque matin), deux pistes restent ouvertes : lancer Claude Code en mode non interactif sur un planning, ou figer la logique dans un script. La décision sera prise avec des Reels réels sous la main (voir section 24).

## Architecture mise à jour

```text
                 INSTAGRAM
                     │
        ┌────────────┴────────────┐
        │                         │
 Comptes surveillés        Ajout manuel (URL)
   (phase 4)                      │
        └────────────┬────────────┘
                     ▼
        APIFY  (Instagram Reel Scraper)
   métadonnées + transcript (option activée)
                     │
                     ▼
     CLAUDE CODE  (+ skill /ajouter-reel)
   analyse · classement · déduplication
                     │
                     ▼
              NOTION (via MCP)
        Reels · Topics · Insights
```

---

# 22. 🛰️ Récupération Instagram : Apify retenu

## Comparaison des options

| | **Apify** | **Bright Data** | **yt-dlp** |
|---|---|---|---|
| Plan gratuit | 5 $ de crédit par mois, sans carte bancaire | 5 000 crédits par mois (environ 7,50 $), sans carte bancaire | Gratuit |
| Volume gratuit annoncé | Environ 1 900 Reels par mois sans option (2,60 $ / 1 000 résultats sur l'actor officiel) | Jusqu'à 5 000 enregistrements par mois | Illimité |
| Report du crédit non utilisé | Non | Non | Sans objet |
| Crédit épuisé | Les runs sont bloqués jusqu'au cycle suivant, sans dépassement facturé | Erreur tant qu'aucun fonds n'est déposé, jusqu'au renouvellement | Sans objet |
| Fiabilité sur Instagram | Bonne (actor maintenu par Apify) | Bonne | Fragile : souvent bloqué sans cookies de connexion |
| Transcript fourni | Oui, en option payante | Non | Non |

Les tarifs et quotas évoluent : les revérifier avant tout changement de plan.

**Choix : Apify**, avec l'actor officiel `apify/instagram-reel-scraper`.

## Tests réalisés le 19/09/2026

Reel de test : publication de `zeyneb_madi` (code `DcES6LItnCw`, 30 secondes). Sa caption ne contient que « Commente Claude et je t'envoie la skill en DM » : **la caption seule est inexploitable**, ce qui confirme qu'il faut analyser le contenu réel de la vidéo (principe de la section 3).

| | Sans transcript | Avec transcript |
|---|---|---|
| Coût du run (1 Reel) | **0,004 $** | **0,052 $** |
| Durée du run | 6 s | 8 s |
| Transcript dans le JSON | Non | Oui (champ `transcript`) |
| Nombre de Reels avec les 5 $ gratuits | Environ 1 250 | Environ 95 |

Constats :

- le transcript est en français, complet et fidèle ; il contient deux erreurs mineures de reconnaissance (« unskillz » à la place de « une skill », un nom propre approximatif), sans conséquence pour l'analyse ;
- le supplément dû à l'option transcript est d'environ 0,048 $ pour un Reel de 30 s (dépend-il de la durée ? à vérifier sur un Reel plus long) ;
- un run à 1 résultat a coûté un peu plus que le tarif unitaire annoncé, probablement à cause d'un coût fixe par run : regrouper plusieurs URL dans un même run devrait coûter moins cher (à vérifier).

## ✅ Décision

**Rester sur Apify avec l'option « Include transcript » activée** dans un premier temps. Un volume de **90 à 95 Reels par mois** est suffisant pour démarrer, et il tient dans le crédit gratuit.

Écartées pour l'instant :

- les options « Include shares count » (sans intérêt pour la base) et « Include downloaded video » (inutile, on n'a pas besoin de conserver la vidéo) ;
- **Whisper en local** : gratuit et moins cher à grande échelle, mais demande une installation (`faster-whisper`, `ffmpeg`). Reste l'option de repli si le coût du transcript Apify devient un problème (voir section 24).

## Champs utiles du JSON et correspondance avec Notion

| Propriété Notion (base 🎬 Reels) | Source |
|---|---|
| **URL** | `url`, ou reconstruite à partir de `shortCode` (ne pas stocker `inputUrl`, qui contient des paramètres de suivi) |
| **Auteur** | `ownerFullName`, avec `ownerUsername` en secours |
| **Date** | `timestamp` |
| **Date d'import** | Date du jour, générée à l'exécution |
| **Caption** | `caption` |
| **Transcript** | `transcript` |
| **Reel** (titre) | Absent des données : titre court généré par Claude à partir du transcript |
| **Résumé** | Généré par Claude |
| **Sujet principal** | Généré par Claude, parmi la liste fermée de la section 8 |
| **Topics liés** | Décision de Claude après recherche parmi les Topics existants |
| **Insights associés** | Un Insight créé par information utile, statut 🔴 À vérifier |
| **Statut** | 🟢 Traité en fin de traitement |

Champ technique à retenir : **`shortCode`** (ex. `DcES6LItnCw`), identifiant unique d'un Reel. Il sert à éviter d'importer deux fois le même Reel (recherche dans la base avant toute insertion).

## Sortie attendue de l'analyse (exemple sur le Reel de test)

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

Le champ **`pertinent`** permet d'ignorer ou de marquer les Reels hors sujet (Claude Code au sens large), pour que la base reste centrée sur son objet. Ce Reel de test a été jugé pertinent : il parle d'une skill, ce qui correspond au contenu recherché.

## Points d'attention

- Les liens `videoUrl` et `audioUrl` d'Instagram expirent : ne pas les stocker.
- Le nombre de commentaires, de likes ou de vues ne sert pas la base de connaissances : ne pas l'importer, sauf besoin ultérieur.
- Nombreux Reels « commente X pour recevoir Y en DM » : la valeur est dans la vidéo, pas dans la caption.
- Le token Apify est un secret : ne jamais le copier dans un document ou dans un dépôt de code.
- Apify a proposé de partager les runs de l'actor avec son développeur (réglable dans Settings > Privacy) : décision à prendre.
- Le scraper ne lit que des contenus publics. Les données personnelles publiques restent soumises au RGPD : ne collecter que ce qui sert la base de connaissances.

---

# 23. 🧭 Étapes suivantes, en détail

## Étape 0 : Prérequis

- [ ] Prendre l'abonnement incluant **Claude Code** (vérifier l'offre sur le site d'Anthropic) et l'installer (l'application de bureau est plus simple qu'un terminal pour débuter).
- [ ] Vérifier que le compte **Apify** est prêt, avec son token personnel (Settings > API & Integrations).
- [ ] Vérifier l'accès à la page Notion « 📚 CLAUDE CODE » et à ses trois bases.

## Étape 1 : Préparer le projet Claude Code

- [ ] Créer un dossier dédié, par exemple `claude-code-knowledge-base`.
- [ ] Y déposer ce document (V1.1) : il servira de contexte permanent au projet.
- [ ] Créer un fichier `CLAUDE.md` court qui résume : l'objectif, les trois bases Notion et leurs propriétés, la liste fermée des sujets principaux, les statuts, et la règle « enrichir plutôt que dupliquer ».
- [ ] Ne rien y écrire de secret (pas de token).

## Étape 2 : Connecter Notion

- [ ] Ajouter le connecteur Notion (serveur MCP) à Claude Code et autoriser l'accès à ton compte.
- [ ] **Partager la page « CLAUDE CODE » avec l'intégration** : sans cela, les bases restent invisibles.
- [ ] Vérifier la procédure exacte dans la documentation de Notion et de Claude Code (elle peut changer).
- [ ] Contrôle : demander à Claude Code de lister les trois bases et leurs propriétés.

## Étape 3 : Connecter Apify

- [ ] Ajouter le serveur MCP d'Apify à Claude Code avec le token Apify.
- [ ] Fixer un **plafond de coût par run** pour que le plan gratuit reste gratuit.
- [ ] Contrôle : lancer l'actor sur une seule URL, option transcript activée, et vérifier que le JSON revient avec le champ `transcript`.

## Étape 4 : Test 1, écriture Notion à blanc

- [ ] Demander la création d'une page Reel **factice** dans 🎬 Reels, avec toutes les propriétés remplies.
- [ ] Créer un Insight factice relié à ce Reel et au Topic « Skills ».
- [ ] Vérifier dans Notion : les relations, les vues liées dans la page du Topic, les statuts, les types de propriétés (Select, Date, URL).
- [ ] Corriger les écarts, puis supprimer les données factices.

## Étape 5 : Test 2, le Reel de test de bout en bout (phase 2)

- [ ] Fournir l'URL du Reel de test (`DcES6LItnCw`).
- [ ] Claude Code : récupère via Apify, analyse (titre, pertinence, résumé, sujet principal, topics, insights), vérifie que le `shortCode` n'existe pas déjà dans 🎬 Reels, puis crée le Reel, les Insights et les relations.
- [ ] Vérifier chaque champ dans Notion, en particulier : sujet principal = Skills, Topic lié = Skills, Insights en 🔴 À vérifier, statut du Reel = 🟢 Traité.
- [ ] Relancer la même URL : le système doit reconnaître le doublon et **ne rien recréer**.

## Étape 6 : Formaliser les règles de classification et de déduplication

- [ ] Écrire dans `CLAUDE.md` les règles de décision, en reprenant les seuils indicatifs de la section 5 (plus de 85 % : enrichir ; 60 à 85 % : à vérifier ; moins de 60 % : créer un Topic).
- [ ] Préciser la marche à suivre pour une correspondance « à vérifier » (demander confirmation plutôt que trancher).
- [ ] Préciser ce que veut dire « enrichir » : ajouter des éléments aux sections du Topic (fonctionnement, mise en pratique, ressources) et de nouveaux Insights, sans réécrire l'existant.
- [ ] Préciser le traitement d'un Reel non pertinent (`pertinent: false`).

## Étape 7 : Phase 3, tester la déduplication

- [ ] Choisir **3 à 5 Reels** sur le même sujet (par exemple les Skills), de créateurs différents.
- [ ] Les traiter un par un.
- [ ] Vérifier : le premier crée ou complète le Topic, les suivants l'enrichissent, sans doublon, avec de nouveaux Insights pertinents.
- [ ] Ajuster les seuils et les instructions selon les erreurs constatées (faux doublons, faux nouveaux Topics).

## Étape 8 : Créer la skill `/ajouter-reel`

- [ ] Une fois la procédure fiable, la transformer en skill : entrée = une URL, sortie = un résumé de ce qui a été créé ou enrichi dans Notion.
- [ ] Garder la skill dans le dossier du projet pour la versionner.

## Étape 9 : Phase 4, surveillance automatique

- [ ] Établir la liste des comptes surveillés (une dizaine).
- [ ] Limiter chaque run aux **2 ou 3 derniers Reels** (ou aux Reels de moins de 24 h avec le filtre de date de l'actor) : le coût dépend du nombre de résultats renvoyés, pas du nombre de comptes.
- [ ] Ignorer tout Reel dont le `shortCode` existe déjà dans la base.
- [ ] Choisir le mode d'exécution planifiée : Claude Code en mode non interactif sur un planning, ou script.
- [ ] Trancher la question du **coût du transcript** (voir section 24).
- [ ] Prévoir une gestion d'erreur simple : si un Reel échoue, le laisser au statut 🔴 À traiter au lieu de perdre l'information.

## Étape 10 : Phase 5, amélioration

Une fois la V1 fiable : digest hebdomadaire, détection des convergences et des contradictions, tendances, suggestions d'action, assistant de recherche (voir sections 16 et 18).

---

# 24. ⚖️ Points de décision à trancher plus tard

## Coût du transcript en surveillance automatique

Avec l'option transcript, un Reel coûte environ 0,052 $ (Reel de 30 s). Le crédit gratuit couvre environ **95 Reels par mois**, suffisant pour l'ajout manuel.

La surveillance de 10 comptes à raison de 1 à 2 Reels par jour représenterait **300 à 600 Reels par mois**, soit bien au-delà du crédit gratuit avec transcript. Avant la phase 4, choisir entre :

| Piste | Principe | Compromis |
|---|---|---|
| Filtrer avant de transcrire | Récupérer d'abord les Reels sans transcript (environ 0,004 $ chacun) et ne demander le transcript que pour ceux jugés prometteurs | Le tri sur la caption seule est peu fiable (voir le Reel de test) |
| Passer à Whisper en local | Télécharger l'audio (`audioUrl`) et le transcrire gratuitement | Installation et maintenance supplémentaires |
| Passer à un plan payant d'Apify | Plus de crédit et tarifs dégressifs | Coût mensuel |
| Réduire le nombre de comptes ou de Reels | Ne suivre que les comptes les plus utiles | Veille moins large |

## Plafonds d'usage de Claude Code

Vérifier, sur des Reels réels, la consommation de l'abonnement pour un traitement de quelques Reels par jour, avant de programmer l'exécution automatique.

## Partage des runs Apify

Décider d'accepter ou non le partage des runs de l'actor avec son développeur.

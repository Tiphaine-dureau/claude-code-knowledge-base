---
name: ajouter-reel
description: Importe un ou plusieurs Reels Instagram dans la base de connaissances Notion (déduplication, Apify, analyse, classement, écriture Notion, compte rendu). À utiliser quand l'utilisateur fournit des URL de Reels, ou sans argument pour traiter la boîte d'entrée Notion « 📥 À importer ».
argument-hint: "[url …] (vide = boîte d'entrée Notion)"
allowed-tools: mcp__notion, mcp__apify
---

# /ajouter-reel

Importe les Reels suivants dans la base Notion « Claude Code Knowledge Base » :

$ARGUMENTS

Les règles de décision (pertinence, sujet principal, seuils, enrichissement, Insights, champs, contraintes Notion) sont dans `CLAUDE.md` : les appliquer strictement. Les identifiants des bases y sont aussi.

## 0. Source des URL

- **URL fournies en argument** : traiter celles-là.
- **Aucune URL fournie** : lire la boîte d'entrée 📥 À importer (data source `5ad9e40d-8ae3-42e4-92c5-17728e11694c`), alimentée depuis le téléphone via Partager → Notion. Pour chaque entrée, chercher un lien `instagram.com/reel/…` ou `instagram.com/p/…` dans cet ordre : propriété `URL`, titre `Nom`, puis contenu de la page (`API-retrieve-page-markdown`). Garder l'id de l'entrée pour l'étape 7.
- Boîte d'entrée vide et aucune URL fournie : le dire et s'arrêter.

## 1. Extraire les shortCodes

- Pour chaque URL : shortCode = segment après `/reel/` ou `/p/`. Ignorer tout ce qui suit (`?utm_source=…`, `stkn=…`, `igsh=…`).
- Dédoublonner la liste (même Reel collé deux fois).
- URL non reconnue (profil, story, autre site) : la signaler dans le compte rendu et ne pas la traiter.

## 2. Vérifier les doublons (avant toute dépense Apify)

- Une seule requête `API-query-data-source` sur 🎬 Reels avec un filtre `or` sur la propriété `shortCode` (`rich_text.equals`) pour tous les shortCodes.
- Chaque shortCode trouvé est retiré du lot, quel que soit son statut (`traité`, `écarté`…). Noter son titre, son statut et son lien pour le compte rendu.
- S'il ne reste rien : passer directement au compte rendu.

## 3. Récupérer les Reels avec Apify

- Un seul appel `apify--instagram-reel-scraper` pour tout le lot restant :
  - `username` : les URL propres `https://www.instagram.com/reel/<shortCode>/` ;
  - `includeTranscript: true`, `includeSharesCount: false`, `includeDownloadedVideo: false` ;
  - `waitSecs: 45`. Si le run n'est pas terminé, attendre avec `get-actor-run`.
- Lire le résultat avec `get-dataset-items` et **uniquement** `fields: shortCode,ownerFullName,ownerUsername,timestamp,videoDuration,caption,transcript`.
- Le décompte d'items annoncé par le run peut être provisoire : se fier au résultat de `get-dataset-items`.
- Un Reel absent du résultat ou sans transcript : le signaler, ne rien écrire pour lui (il pourra être relancé).

## 4. Analyser et préparer les décisions

Pour chaque Reel, **sans rien écrire encore** :

1. Pertinence (règles de `CLAUDE.md`).
2. Si pertinent : titre, résumé, caption utile ou non, sujet principal, Topic(s), 1 à 3 Insights.
3. Pour le rapprochement avec les Topics : lister les Topics existants (`API-query-data-source` sur 🗂️ Topics, ignorer « Template ») et lire la page des candidats (`API-retrieve-page-markdown`).
4. Pour les Insights : lire les Insights déjà reliés au Topic cible (filtre relation `Topics contains <id>`) afin de repérer une idée identique (→ ajouter une source au lieu de créer).

Classer chaque Reel en « décision sûre » ou « à valider » (correspondance 60–85 %, nouveau sujet, pertinence douteuse).

**Poser toutes les questions en une seule fois** (`AskUserQuestion`, une question par Reel à valider, avec une option recommandée en premier), puis attendre les réponses avant d'écrire quoi que ce soit.

## 5. Écrire dans Notion

Traiter les Reels **du plus ancien au plus récent** (`timestamp`).

**Reel pertinent**, dans cet ordre :

1. Nouveau sujet validé : ajouter l'option au Select `Sujet principal` (`API-update-a-data-source`, en renvoyant toutes les options existantes avec leur `id`), créer le Topic depuis le modèle (`API-post-page` avec `template: {type: "template_id", template_id: <id du modèle>}` ; l'id s'obtient avec `API-list-data-source-templates`), puis ajouter le sujet à la liste fermée de `CLAUDE.md`.
2. Créer le Reel en statut `en cours` avec toutes ses propriétés (URL reconstruite, transcript découpé si plus de 2000 caractères).
3. Insights : créer les nouveaux (`A vérifier`, relations `Topics` + `Source`) ; pour une idée déjà présente, ajouter ce Reel à la `Source` existante (renvoyer la liste complète des sources).
4. Enrichir le Topic avec `API-update-page-markdown` en `update_content` (remplacements ciblés, jamais `replace_content`) : remplacer une phrase d'aide du modèle ou ajouter une puce sourcée (auteur, mois). Relire la page après écriture pour vérifier qu'aucun nom de fichier n'a été transformé en lien.
5. Passer le Reel en `traité`.

**Reel non pertinent** : fiche minimale en statut `écarté` (voir `CLAUDE.md`).

**Erreur en cours de route** : laisser le Reel en `a traiter`, continuer avec les suivants, signaler l'erreur.

## 6. Vider la boîte d'entrée

Uniquement pour les Reels venus de 📥 À importer :

- **Traité, écarté ou déjà en base** : mettre l'entrée à la corbeille (`API-patch-page`, `in_trash: true`).
- **Question restée sans réponse, erreur, Reel absent du résultat Apify** : garder l'entrée et écrire la raison dans sa propriété `Note`.
- **Aucun lien Instagram trouvé** : garder l'entrée, `Note` = « Aucun lien Instagram trouvé ».

## 7. Compte rendu

Terminer par un tableau court :

| Reel | Résultat |
|---|---|
| titre (auteur) | Topic créé / enrichi / relié, nombre d'Insights créés ou sources ajoutées |
| titre (auteur) | écarté : raison |
| shortCode | déjà en base (statut) |

Puis, en une ligne chacun :

- le nombre de Reels passés dans Apify et le coût estimé (environ 0,05 à 0,10 $ par Reel avec transcript) ;
- les anomalies (Reel absent du résultat Apify, erreur Notion, URL non reconnue) ;
- les points que l'utilisateur pourrait vouloir vérifier dans Notion ;
- le nombre d'entrées restées dans 📥 À importer, et pourquoi.

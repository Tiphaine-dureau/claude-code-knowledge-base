---
name: publier-insights
description: Régénère les données de l'interface web « Veille Claude Code » depuis Notion (Topics, Insights, Reels traités) et republie l'artefact à la même adresse. À utiliser après un import de Reels ou quand l'utilisatrice demande de mettre à jour la page.
allowed-tools: mcp__notion, Artifact, Write, Read
---

# /publier-insights

Met à jour la page https://claude.ai/artifact/NphDoxdMUmRvSspUdtrfxK à partir de Notion.

- Page : `interface/index.html`, `interface/styles.css`, `interface/js/*.js` (versionnés, ne pas les modifier ici).
- Données : `interface/data.json` (régénérée à chaque fois, ignorée par git).

## 1. Lire Notion

Trois requêtes `API-query-data-source` (identifiants dans `CLAUDE.md`) :

- 🗂️ **Topics** : toutes les pages (ignorer le modèle « Template » s'il apparaît).
- 💡 **Insights** : toutes les pages.
- 🎬 **Reels** : filtre `Statut` = `traité` uniquement. Jamais les Reels `écarté`, `a traiter` ou `en cours`. Limiter les propriétés avec `filter_properties` (titre, URL, Auteur, Date, Résumé, Date import) : ne jamais lire ni publier le Transcript ou la Caption.

Paginer avec `start_cursor` tant que `has_more` est vrai.

## 2. Construire `interface/data.json`

Identifiant court de chaque page Notion = les **12 derniers caractères** de son id sans tirets (ex. `3e61c46e-c16a-8196-aae1-f705756fa05f` → `f705756fa05f`).

Pour les textes, concaténer les `plain_text` de tous les éléments puis supprimer les espaces et retours à la ligne en début et fin.

```json
{
  "updated": "AAAA-MM-JJ (date du jour)",
  "topics": [{"id": "…", "name": "nom exact du Topic"}],
  "reels": {
    "<id court>": {"title": "…", "author": "…", "date": "AAAA-MM-JJ", "url": "https://www.instagram.com/reel/<shortCode>/", "summary": "…", "imported": "AAAA-MM-JJ (Date import)"}
  },
  "insights": [
    {"id": "…", "text": "…", "topics": ["<id court Topic>"], "sources": ["<id court Reel>"]}
  ]
}
```

Règles :

- `topics` : trier par nombre d'Insights décroissant (la page masque ceux qui n'en ont aucun).
- `insights[].sources` : ne garder que les Reels présents dans `reels` (donc traités). Un Insight sans aucune source restante est omis.
- `insights[].topics` : ne garder que les Topics présents dans `topics`.
- `reels[].imported` : la `Date import` du Reel. La page marque « New » (badge + bordure) les Reels de la date d'import la plus récente et les Insights qui en ont une source ; le marqueur passe aux suivants au prochain import.
- Ne rien ajouter d'autre (pas de statut, pas de transcript, pas de caption, pas de lien Notion) : la page peut être partagée.

Écrire le fichier avec `Write` (JSON valide, UTF-8).

## 3. Republier l'artefact

1. `Artifact` avec `action: "read"` et `url: "https://claude.ai/artifact/NphDoxdMUmRvSspUdtrfxK"` (obligatoire avant de republier depuis une nouvelle session).
2. `Artifact` (publish) avec :
   - `url` : `https://claude.ai/artifact/NphDoxdMUmRvSspUdtrfxK` ;
   - `file_path` : `interface/index.html` ;
   - `files` : `{"data.json": "interface/data.json", "styles.css": "interface/styles.css", "js/app.js": "interface/js/app.js", "js/lib.js": "interface/js/lib.js", "js/inbox.js": "interface/js/inbox.js"}` ;
   - sans `icon` ni `capabilities` (ils sont conservés).

Si la publication est refusée pour conflit (une version plus récente existe), relire l'artefact, vérifier que seule la page a changé, puis republier. Ne jamais utiliser `force`.

## 4. Compte rendu

Une ligne : nombre de Topics affichés, d'Insights, de Reels, et le lien de la page. Signaler tout Insight omis faute de source.

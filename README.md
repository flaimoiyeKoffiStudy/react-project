# Ma Revue – Tableau de bord d'actualités RSS personnalisées

Express (API REST) + React/Vite/Tailwind. Prérequis : Node.js 18 ou plus.

## Lancer le projet

```bash
# Terminal 1 – API (http://localhost:4000)
cd backend
cp .env.example .env      # puis définir JWT_SECRET
npm install
npm run dev

# Terminal 2 – Interface (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Créez un compte depuis la page d'accueil : 5 sources par défaut sont ajoutées (modifiables).

## Logigramme implémenté (backend/src/services)

1. Collecte : `rssService.fetchFeed` (fetch sécurisé, timeout 8 s, taille max, anti-SSRF, cache, repli sur le cache en cas d'échec)
2. Normalisation : même format pour tous les flux, texte nettoyé de tout HTML
3. Dédoublonnage : `aggregatorService`
4. Filtrage : catégorie, recherche, non-lus, centres d'intérêt
5. Scoring par mots-clés puis tri et pagination
6. Affichage : `useArticles` puis `ArticleList` (frontend)

Un rafraîchissement automatique tourne en tâche de fond (`scheduler.js`).

## API

| Méthode | Route | Rôle |
|---|---|---|
| POST | /api/auth/register, /login | Inscription, connexion (JWT) |
| GET | /api/auth/me | Utilisateur courant |
| GET, PUT | /api/preferences | Catégories et mots-clés |
| GET, POST | /api/feeds | Lister, ajouter une source |
| PUT, DELETE | /api/feeds/:id | Modifier, supprimer |
| GET | /api/articles?view=foryou\|all&category=&q=&unread=true&page=&refresh=true | Articles agrégés |
| GET | /api/articles/library | Lus et favoris |
| POST, DELETE | /api/articles/:id/read | Lu, non lu |
| POST, DELETE | /api/articles/favorites[/:id] | Favoris |

## Pour la production
- Remplacer `models/db.js` (fichier JSON) par MongoDB ou PostgreSQL.
- Définir `JWT_SECRET`, `CORS_ORIGIN` et `NODE_ENV=production`.
- `npm run build` dans `frontend`, puis servir `dist/` derrière un reverse proxy HTTPS.

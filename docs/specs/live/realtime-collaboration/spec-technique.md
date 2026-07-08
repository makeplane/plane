# Spec Technique — live/realtime-collaboration

| Champ         | Valeur                        |
|---------------|-------------------------------|
| Module        | live/realtime-collaboration   |
| Version       | 0.1.0                         |
| Date          | 2026-06-30                    |
| Source        | Rétro-ingénierie              |

## Architecture du module

`apps/live` est un service Node.js autonome structuré autour d'un serveur Express 4 enrichi de WebSocket via `express-ws`. La pièce centrale est une instance Hocuspocus 2 (serveur CRDT Y.js), exposée derrière un contrôleur WebSocket, et entourée de cinq extensions chargées dans un ordre précis.

```
[Client WebSocket]
       |
[Express + express-ws]
       |
[CollaborationController  @/collaboration/]
       |
[HocusPocusServerManager  (singleton)]
       |
[Hocuspocus server (debounce=10000ms)]
       |
  ┌────┴──────────────────────────────────────────────┐
  │ Extensions (ordre d'initialisation)               │
  │  1. Logger                                        │
  │  2. Database  (fetch/store ↔ API Django)          │
  │  3. Redis     (sync inter-nœuds + canal admin)    │
  │  4. TitleSyncExtension  (debounce=5000ms)         │
  │  5. ForceCloseHandler   (doit venir après Redis)  │
  └───────────────────────────────────────────────────┘
       |
[Express HTTP REST]
  ├── POST /live/pdf-export/   (PdfExportController)
  ├── GET  /live/health        (HealthController)
  └── GET  /live/document/*    (DocumentController)
```

La communication avec l'API Django se fait en HTTP REST (Axios) depuis les services de page, en réutilisant le cookie de session de l'utilisateur connecté via WebSocket.

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/live/src/hocuspocus.ts` | Singleton `HocusPocusServerManager` — configure et initialise l'instance Hocuspocus | ~70 |
| `apps/live/src/server.ts` | Classe `Server` — Express, middlewares (helmet, compression, CORS), initialisation Redis + Hocuspocus, routage | ~129 |
| `apps/live/src/env.ts` | Validation des variables d'environnement via Zod au démarrage | ~43 |
| `apps/live/src/controllers/collaboration.controller.ts` | Contrôleur WebSocket — délègue chaque connexion à Hocuspocus, gère les erreurs | ~40 |
| `apps/live/src/controllers/pdf-export.controller.ts` | Contrôleur REST POST — valide la requête via Effect-TS/Schema, orchestre l'export PDF | ~143 |
| `apps/live/src/extensions/database.ts` | Extension Hocuspocus — `fetchDocument` (chargement binaire + fallback HTML) et `storeDocument` (persistence triple-format + gestion 413) | ~141 |
| `apps/live/src/extensions/redis.ts` | Extension Redis custom — sync inter-nœuds + canal admin `hocuspocus:admin` pour commandes (ex. `force_close`) | ~142 |
| `apps/live/src/extensions/title-sync.ts` | Extension Hocuspocus — observe le fragment Y.js `title`, déclenche la synchronisation différée vers l'API Django | ~182 |
| `apps/live/src/extensions/title-update/title-update-manager.ts` | Gère le cycle de vie d'une mise à jour de titre : debounce, abort, force-save | ~97 |
| `apps/live/src/extensions/title-update/debounce.ts` | `DebounceManager` — debounce avec `AbortController`, support flush et cancel | ~284 |
| `apps/live/src/extensions/force-close-handler.ts` | Extension Hocuspocus — reçoit les commandes `force_close` Redis et ferme les connexions locales | ~203 |
| `apps/live/src/lib/auth.ts` | `onAuthenticate` — parse le token JSON, valide le cookie auprès de Django (`/api/users/me/`) | ~97 |
| `apps/live/src/lib/auth-middleware.ts` | Middleware Express `requireSecretKey` — vérifie l'en-tête `live-server-secret-key` (note : TODO HMAC en commentaire) | ~57 |
| `apps/live/src/lib/stateless.ts` | `onStateless` — broadcast des événements collaboratifs (`DocumentCollaborativeEvents`) | ~21 |
| `apps/live/src/services/page/core.service.ts` | `PageCoreService` — appels HTTP vers l'API Django : `fetchDetails`, `fetchDescriptionBinary`, `updateDescriptionBinary`, `updatePageProperties`, `fetchUserMentions`, `resolveImageAssetUrl(s)` | ~228 |
| `apps/live/src/services/page/extended.service.ts` | `PageService` abstract — point d'extension pour la version enterprise | ~18 |
| `apps/live/src/services/page/project-page.service.ts` | `ProjectPageService` — implémentation concrète pour le type `project_page`, construit le `basePath` | ~32 |
| `apps/live/src/services/page/handler.ts` | `getPageService` — factory qui retourne le service adapté au `documentType` | ~23 |
| `apps/live/src/types/index.ts` | Types `HocusPocusServerContext`, `TDocumentTypes` (= `"project_page"`) | ~35 |
| `apps/live/src/types/admin-commands.ts` | Enum `AdminCommand`, codes de fermeture `CloseCode`, types des messages | ~N/A |

## API / Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `WS` | `/live/collaboration/` | Connexion WebSocket Hocuspocus — édition collaborative | Token JSON dans le handshake WebSocket (`{id, cookie}`) |
| `POST` | `/live/pdf-export/` | Export PDF d'une page Plane | Cookie Django dans les en-têtes HTTP |
| `GET` | `/live/health` | Health check (non documenté en détail — déduit de la présence de `HealthController`) | Aucune (présumée publique) |
| `GET` | `/live/document/*` | Opérations sur les documents (non documenté en détail — déduit de la présence de `DocumentController`) | Inconnu |

## Patterns identifiés

- **Singleton pattern** : `HocusPocusServerManager` implémente le pattern Singleton pour garantir une unique instance Hocuspocus par processus Node.js.
- **Extension pattern (Hocuspocus)** : les comportements (persistence, Redis, titre, logs, force-close) sont séparés en extensions Hocuspocus distinctes, chargées dans un ordre explicite. L'ordre est significatif : `ForceCloseHandler` doit être initialisé après `Redis` pour pouvoir s'y accrocher.
- **Service layer pattern** : la couche d'appel HTTP vers l'API Django est abstraite via `PageCoreService` (méthodes HTTP génériques) → `PageService` (point d'extension enterprise) → `ProjectPageService` (implémentation concrète) → `getPageService` (factory).
- **Effect-TS pour la gestion des erreurs typées** : `PdfExportController` utilise `Effect.gen`, `Schema.decodeUnknown`, `Effect.catchAll` et `Effect.catchAllDefect` pour modéliser les erreurs de façon exhaustive et sans exceptions implicites.
- **Decorator pattern pour le routage** : `@Controller`, `@WebSocket`, `@Post`, `@Middleware` (via `@plane/decorators`) remplacent la configuration Express impérative.
- **AbortController pour les requêtes HTTP annulables** : `DebounceManager` crée un `AbortController` par appel et l'annule si un nouvel appel arrive avant la fin du précédent. `PageCoreService.updatePageProperties` utilise la méthode `Promise.race` pour propager l'annulation.

## Variables d'environnement requises

| Variable | Obligatoire | Valeur par défaut | Description |
|----------|-------------|-------------------|-------------|
| `API_BASE_URL` | Oui | — | URL de base de l'API Django (ex. `http://api:8000`) |
| `LIVE_SERVER_SECRET_KEY` | Oui | — | Clé secrète partagée pour les endpoints internes |
| `PORT` | Non | `3000` | Port d'écoute Express |
| `LIVE_BASE_PATH` | Non | `/live` | Préfixe de base des routes |
| `CORS_ALLOWED_ORIGINS` | Non | `""` | Origines CORS autorisées (séparées par virgule) |
| `REDIS_HOST` | Non | — | Hôte Redis (alternatif à `REDIS_URL`) |
| `REDIS_PORT` | Non | `6379` | Port Redis |
| `REDIS_URL` | Non | — | URL Redis complète |
| `HOSTNAME` | Non | UUID aléatoire | Nom du nœud Hocuspocus (utile en cluster) |
| `COMPRESSION_LEVEL` | Non | `6` | Niveau de compression gzip |
| `COMPRESSION_THRESHOLD` | Non | `5000` | Seuil de compression en octets |

## Stratégie d'authentification WebSocket

L'authentification se fait en deux étapes dans `onAuthenticate` :
1. **Parsing du token** : le token WebSocket est un JSON `{id: string, cookie: string}`. En cas d'échec de parsing, le cookie est récupéré depuis les en-têtes HTTP de la requête d'upgrade.
2. **Validation côté API** : appel à `UserService.currentUser(cookie)` qui contacte l'API Django. Si `user.id !== userId` (déclaré dans le token), la connexion est rejetée.

Le contexte validé (`cookie`, `userId`, `workspaceSlug`, `projectId`, `documentType`) est ensuite porté dans `HocusPocusServerContext` pour toute la durée de la connexion WebSocket.

## Gestion des erreurs de persistence

| Cas d'erreur | Code HTTP | Comportement |
|---|---|---|
| Document trop large | 413 | Message `force_close` → fermeture WebSocket → unload document (local + Redis pub) |
| Erreur générique de sauvegarde | autre | Broadcast d'erreur au frontend, exception levée (Hocuspocus décide du retry) |
| Erreur de chargement | toute | Broadcast d'erreur au frontend, exception levée |

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|----------------|--------|
| `apps/live/src/__tests__/` (2 fichiers Vitest — contenu non lu) | Non détaillé (déduit de la présence de Vitest dans le package.json) | Existant |

## Décisions techniques documentées en spec-technique (non éligibles à un ADR)

- **Debounce de 10s pour la persistence Hocuspocus** : valeur configurée dans `hocuspocus.ts` (`debounce: 10000`). Heuristique d'implémentation pour limiter la pression sur l'API Django → AP-3.
- **Debounce de 5s pour la synchronisation du titre** : valeur par défaut dans `TitleUpdateManager` (`wait: 5000`). Choix d'implémentation local → AP-3.
- **Ordre des extensions Hocuspocus** : `ForceCloseHandler` doit être déclaré après `Redis` dans le tableau `getExtensions()` pour pouvoir appeler `onAdminCommand`. Contrainte d'implémentation locale → AP-4.
- **TODO HMAC sur l'auth admin** : le commentaire `// TODO - Move to hmac` dans `auth-middleware.ts` indique que l'authentification par `live-server-secret-key` (header statique) est un placeholder. À migrer vers HMAC pour les endpoints admin.
- **`documentType` uniquement `project_page`** : le type `TDocumentTypes = "project_page"` indique que l'architecture permet plusieurs types de documents mais seul `project_page` est implémenté. Les autres types (potentiellement en version enterprise) retournent une `AppError`.
- **Cookie de session réutilisé pour les appels HTTP** : le service live réutilise le cookie Django de l'utilisateur WebSocket pour tous ses appels HTTP vers l'API. Il n'y a pas de token service-to-service — les permissions sont vérifiées par l'API Django en se basant sur le cookie.
- **`PageService` abstract** : la présence d'une couche `extended.service.ts` (abstract, commentaire "implementation found in enterprise repository") signale une architecture prête pour l'extension enterprise. La version community n'ajoute aucune méthode au-delà de `PageCoreService`.

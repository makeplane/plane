# RETRO-071 — Serveur de collaboration temps réel dédié (Node.js/Hocuspocus) séparé de Django

| Champ      | Valeur                          |
|------------|---------------------------------|
| Statut     | Documenté (rétro)               |
| Date       | 2026-06-30                      |
| Source     | Rétro-ingénierie                |
| Features   | live/realtime-collaboration     |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | STACK |
| Q1 — Coût de revert > 1j ? | OUI — migrer vers Django Channels (qui est déjà présent dans `apps/api` v4.1.0) nécessiterait réécrire l'intégralité de `apps/live` : authent WebSocket Hocuspocus, cinq extensions (Database, Redis, TitleSync, ForceCloseHandler, Logger), le canal admin Redis, l'export PDF serveur-side, et adapter tous les clients WebSocket dans `apps/web`. Effort estimé à plusieurs jours de refactoring transverse. |
| Q2 — Non-déductible du code ? | OUI — `pnpm-workspace.yaml` et `package.json` révèlent qu'Express + Hocuspocus est le choix, mais ne documentent pas pourquoi un process Node.js séparé a été préféré à Django Channels (déjà en place dans `apps/api`). L'intention architecturale — isoler la charge WebSocket Y.js du worker Gunicorn/Uvicorn Django et bénéficier de l'écosystème Y.js natif TypeScript — ne se lit pas depuis les configs. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — concerne directement `live/realtime-collaboration` (l'app entière), `api/pages` (qui délègue la synchronisation temps réel à `apps/live` via WebSocket et appelle `apps/live` pour la persistance), et les apps front `apps/web` et `apps/space` (qui doivent savoir à quelle URL WebSocket se connecter via `NEXT_PUBLIC_LIVE_BASE_URL`). |
| Q4 — Casse un invariant si ignoré ? | OUI — un développeur qui tenterait d'implémenter la collaboration CRDT directement dans Django `apps/api` contournerait l'isolation de charge temps-réel, introduirait un conflit avec l'extension Redis Hocuspocus configurée dans `apps/live`, et briserait le modèle d'authentification WebSocket (token JSON → validation Django → contexte Hocuspocus) qui garantit que seuls les utilisateurs légitimes accèdent aux documents collaboratifs. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane gère l'édition collaborative de pages documentaires (format Tiptap/ProseMirror) via le protocole CRDT Y.js. La synchronisation en temps réel requiert un serveur WebSocket capable de fusionner des opérations CRDT de multiple clients simultanément.

L'API principale (`apps/api`) est construite sur Django 4.2 et inclut Django Channels 4.1.0, qui aurait pu gérer les WebSockets. Cependant, l'écosystème Y.js et le framework Hocuspocus sont natifs TypeScript/Node.js — le portage en Python est inexistant ou immature à la date de cette décision.

## Décision identifiée

Un service Node.js/TypeScript distinct (`apps/live`) a été créé pour gérer exclusivement la collaboration temps réel. Ce service utilise :
- **Express 4.22** comme serveur HTTP (pour les endpoints REST complémentaires : PDF export, health check)
- **Hocuspocus 2.15.2** comme serveur CRDT Y.js (WebSocket, fusion CRDT, persistence)
- **ioredis 5.7.0** pour la synchronisation inter-nœuds et le canal de commandes admin
- **@react-pdf/renderer** pour l'export PDF serveur-side

Ce service communique avec `apps/api` Django en HTTP REST pour authentifier les connexions, charger et persister les documents.

## Conséquences observées

### Positives

- **Isolation de charge** : la charge WebSocket temps-réel (connexions longues, mises à jour fréquentes) est isolée du pool de workers Gunicorn/Celery Django, évitant la contention de ressources.
- **Écosystème Y.js natif** : Hocuspocus, y-prosemirror, y-protocols et le package `@plane/editor` sont TypeScript-first — pas de bridge Python nécessaire.
- **Scalabilité indépendante** : `apps/live` peut être mis à l'échelle horizontalement indépendamment de `apps/api` via l'extension Redis Hocuspocus.
- **Extension enterprise facilitée** : la couche `PageService` abstract (`extended.service.ts`) permet d'injecter des comportements supplémentaires en version enterprise sans modifier `apps/live`.

### Négatives / Dette

- **Surface d'authentification dupliquée** : `apps/live` implémente sa propre logique d'authentification WebSocket (validation du cookie Django via appel HTTP), séparée du middleware Django. Toute évolution de l'auth Django doit être répercutée dans `apps/live`.
- **Dépendance HTTP synchrone** : chaque connexion WebSocket déclenche un appel HTTP vers `apps/api` pour valider le cookie, introduisant une latence à l'établissement de la connexion et un couplage fort entre les deux services.
- **Secret key statique sur les endpoints admin** : l'en-tête `live-server-secret-key` est une authentification par secret partagé (non signée). Un commentaire `TODO - Move to hmac` dans `auth-middleware.ts` indique que cette approche est un placeholder.
- **Un seul `documentType` implémenté** : l'architecture supporte plusieurs types de documents (`TDocumentTypes`), mais seul `project_page` est implémenté dans la version community. La factory `getPageService` lève une exception pour tout autre type.

## Recommandation

**Garder.** Le choix Node.js/Hocuspocus est structurellement justifié par l'absence d'alternatives matures en Python pour le protocole Y.js/CRDT, et par le besoin d'isolation de charge. La dette identifiée (secret key, couplage HTTP synchrone) est connue de l'équipe (TODO HMAC visible) et ne remet pas en cause la décision architecturale.

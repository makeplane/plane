# Spec Fonctionnelle — live/realtime-collaboration [DRAFT — à valider par le dev]

| Champ      | Valeur                        |
|------------|-------------------------------|
| Module     | live/realtime-collaboration   |
| Version    | 0.1.0                         |
| Date       | 2026-06-30                    |
| Auteur     | retro-documenter              |
| Statut     | DRAFT                         |
| Source     | Rétro-ingénierie              |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-071](../../adr/RETRO-071-live-dedicated-collab-server.md) | Serveur de collaboration temps réel dédié (Node.js/Hocuspocus) séparé de Django | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

`apps/live` est un micro-service Node.js/TypeScript distinct de l'API Django principale. Il sert de serveur de collaboration temps réel pour l'édition des pages documentaires de Plane. Son rôle est de synchroniser les modifications de contenu entre plusieurs utilisateurs simultanés en s'appuyant sur la technologie CRDT Y.js via le framework Hocuspocus.

Ce service est déployé comme un conteneur Docker indépendant, exposé derrière le reverse proxy Caddy, et communique avec l'API Django pour authentifier les connexions et persister le contenu des documents.

## Règles métier (déduites du code)

1. **Authentification obligatoire à la connexion WebSocket** : toute connexion WebSocket doit fournir un token JSON contenant `id` (userId) et `cookie` (session Django). En l'absence de ces données, la connexion est rejetée avant toute synchronisation.

2. **Vérification de l'identité côté API Django** : le service live rappelle l'API Django (`/api/users/me/`) pour valider le cookie de session et vérifie que le `userId` déclaré dans le token correspond à l'utilisateur retourné par l'API. Une discordance entraîne le rejet.

3. **Contexte de connexion porté par la WebSocket** : chaque connexion WebSocket porte un contexte contenant `workspaceSlug`, `projectId`, `documentType` (actuellement uniquement `project_page`) et `userId`. Ces valeurs sont extraites des paramètres de la requête d'upgrade WebSocket.

4. **Fallback HTML vers binaire à la première ouverture** : si le document Y.js binaire est vide (nouvelle page ou migration), le service charge le contenu HTML depuis l'API Django, le convertit en binaire Y.js, et le persiste immédiatement avant de le servir aux clients.

5. **Persistance triple-format à chaque sauvegarde** : lors de chaque store Hocuspocus (déclenché avec un debounce de 10 secondes), le binaire Y.js est converti en trois formats simultanément (binary, HTML, JSON) et les trois sont persistés via l'API Django. Ce comportement est en cohérence avec RETRO-031 [DATA-MODEL].

6. **Synchronisation différée du titre** : le titre du document est observé dans le fragment Y.js `title`. Tout changement de titre déclenche une mise à jour différée vers l'API Django avec un debounce de 5 secondes. Au déchargement du document, le titre est forcé en sauvegarde immédiate.

7. **Migration à la demande des anciens titres** : si le champ `title` du document Y.js est vide, le titre est extrait depuis l'API Django et injecté dans le document Y.js (migration one-shot par document).

8. **Fermeture forcée sur document trop large** : si une sauvegarde échoue avec un code HTTP 413, le service envoie un message `force_close` à tous les clients connectés (sur tous les serveurs via Redis), ferme les connexions WebSocket, puis décharge le document de la mémoire.

9. **Canal admin Redis pour commandes inter-serveurs** : une extension Redis custom (`hocuspocus:admin`) permet de propager des commandes (ex. `force_close`) à tous les nœuds du cluster Hocuspocus, garantissant qu'un document est fermé sur l'ensemble du cluster.

10. **Export PDF serveur-side** : un endpoint REST POST `/pdf-export/` (non-WebSocket) accepte un corps JSON décrivant une page Plane et retourne un PDF binaire généré via `@react-pdf/renderer`. L'authentification repose sur la présence du cookie Django dans les en-têtes de la requête.

11. **Validation de l'environnement au démarrage** : les variables d'environnement sont validées via un schéma Zod au démarrage. Un `API_BASE_URL` valide et un `LIVE_SERVER_SECRET_KEY` sont obligatoires ; en cas d'erreur, le processus s'arrête immédiatement.

## Cas d'usage (déduits)

### CU-001 — Ouverture d'une page collaborative

**Acteur :** utilisateur Plane authentifié.

**Flux principal :**
1. Le client web établit une connexion WebSocket vers `/live/collaboration/` avec un token JSON (`{id, cookie}`) et les paramètres `workspaceSlug`, `projectId`, `documentType=project_page`.
2. Hocuspocus appelle `onAuthenticate` : parse le token, valide le cookie auprès de l'API Django, vérifie la correspondance userId.
3. Si le document n'est pas déjà en mémoire, l'extension `Database` charge le binaire Y.js depuis l'API Django.
4. Si le binaire est vide, conversion HTML→binaire et persistence immédiate.
5. L'extension `TitleSync` injecte le titre dans le fragment Y.js si absent.
6. Le client reçoit l'état courant du document et peut commencer à éditer.

**Variantes :**
- Authentification échouée : la connexion WebSocket est fermée avec le code 1011.
- Document déjà en mémoire (autre utilisateur connecté) : le binaire Y.js en mémoire est partagé directement, sans rechargement depuis l'API.

### CU-002 — Edition collaborative en temps réel

**Acteur :** plusieurs utilisateurs simultanés sur la même page.

**Flux principal :**
1. Les clients échangent des mises à jour Y.js via WebSocket (protocole Hocuspocus/CRDT).
2. Hocuspocus fusionne les opérations CRDT et diffuse les changements à tous les clients connectés.
3. Toutes les 10 secondes (debounce configuré sur le serveur), l'extension `Database` persiste l'état Y.js vers l'API Django en triple format.
4. Tout changement de titre déclenche également une mise à jour différée (5 secondes) du champ `name` de la page via l'API Django.

### CU-003 — Fermeture d'une session de collaboration

**Acteur :** dernier utilisateur quittant une page.

**Flux principal :**
1. La connexion WebSocket est fermée côté client.
2. Hocuspocus déclenche `beforeUnloadDocument` : le titre est sauvegardé immédiatement (flush du debounce).
3. Le document est déchargé de la mémoire du serveur.

### CU-004 — Export PDF d'une page

**Acteur :** utilisateur Plane authentifié.

**Flux principal :**
1. Le client envoie une requête POST `/live/pdf-export/` avec les métadonnées de la page (pageId, workspaceSlug, projectId, titre, auteur, taille de page…) et son cookie Django.
2. Le service valide le corps via Effect-TS/Schema.
3. Le service récupère le contenu de la page depuis l'API Django et génère un PDF via `@react-pdf/renderer`.
4. Le PDF binaire est retourné en réponse HTTP avec les en-têtes appropriés.

### CU-005 — Fermeture forcée d'un document (document trop grand)

**Acteur :** système (déclenché par une erreur 413 de l'API Django).

**Flux principal :**
1. L'extension `Database` tente de persister le document mais reçoit une réponse 413.
2. Un message `force_close` est broadcasté à tous les clients locaux.
3. La commande `FORCE_CLOSE` est publiée sur le canal Redis `hocuspocus:admin`.
4. Tous les nœuds Hocuspocus reçoivent la commande, ferment leurs connexions locales, et déchargent le document.

## Dépendances

- **API Django (`apps/api`)** : source de vérité pour les données de page. Appelée en HTTP/REST pour l'authentification, le chargement et la persistence des documents, et la mise à jour du titre.
- **Redis/Valkey** : utilisé par l'extension Hocuspocus Redis pour la synchronisation des états de documents entre nœuds et pour le canal de commandes admin.
- **`@plane/editor`** : package interne exposant les utilitaires de conversion entre formats (binaire Y.js, HTML, JSON) et les extensions Tiptap pour le titre.
- **`@plane/types`** : types partagés (`TPage`, `TDocumentPayload`).
- **`@plane/decorators`** : décorateurs `@Controller`, `@WebSocket`, `@Post` pour le routage Express.
- **`@plane/logger`** : logger partagé.

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Scalabilité du cluster** : le code supporte plusieurs nœuds Hocuspocus via Redis, mais la configuration du nombre de nœuds en production n'est pas visible dans le code de l'app `live`.
- **Type `extended.service.ts`** : la classe `PageService` est marquée comme une couche d'extension dont l'implémentation complète se trouverait dans un repository enterprise distinct. Les méthodes additionnelles disponibles en version enterprise sont inconnues.
- **Fréquence de debounce côté Hocuspocus** : le debounce de 10 secondes pour la persistence (`hocuspocus.ts`) est distinct du debounce de 5 secondes pour le titre (`TitleUpdateManager`). Il n'est pas documenté si ces deux valeurs ont été choisies conjointement ou indépendamment.
- **Politique de retry en cas d'erreur de persistence** : en cas d'échec de `storeDocument` (hors 413), une exception est levée mais aucun mécanisme de retry explicite n'est visible dans le code (il est possible que Hocuspocus gère cela en interne).
- **Authentification de l'endpoint PDF** : l'endpoint `/pdf-export/` vérifie uniquement la présence d'un cookie, sans vérifier les permissions de l'utilisateur sur la page demandée. La vérification est déléguée à l'API Django lors du fetch du contenu.

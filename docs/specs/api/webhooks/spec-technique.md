# Spec Technique — Webhooks sortants

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/webhooks        |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

## Architecture du module

Le module webhooks suit un pipeline en trois étapes :

1. **Configuration (synchrone, API REST)** — Les administrateurs créent et gèrent les webhooks via `WebhookEndpoint`. La validation anti-SSRF est appliquée à la création et à la mise à jour dans `WebhookSerializer`.

2. **Dispatch (asynchrone, Celery)** — Quand une activité se produit sur un objet Plane, la tâche `model_activity` (ou directement `webhook_activity`) est déclenchée par les vues métier concernées. `webhook_activity` filtre les webhooks actifs abonnés à l'événement, puis appelle `webhook_send_task.delay()` pour chaque webhook éligible.

3. **Envoi (asynchrone, Celery avec retry)** — `webhook_send_task` charge le webhook, construit le payload, le signe avec HMAC-SHA256, puis utilise `pinned_fetch` pour effectuer le POST en protégeant contre le DNS rebinding. Le résultat est enregistré dans `WebhookLog`.

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/webhook.py` | Modèles Webhook, WebhookLog, ProjectWebhook + validateurs URL + générateur de token | ~110 |
| `apps/api/plane/app/views/webhook/base.py` | Vues REST : CRUD webhooks, régénération clé, consultation logs | ~127 |
| `apps/api/plane/app/urls/webhook.py` | Déclaration des 4 URL patterns | ~32 |
| `apps/api/plane/app/serializers/webhook.py` | WebhookSerializer (validation SSRF + domaines), WebhookLogSerializer | ~79 |
| `apps/api/plane/bgtasks/webhook_task.py` | Tâches Celery : webhook_activity, webhook_send_task, model_activity, send_webhook_deactivation_email | ~522 |
| `apps/api/plane/utils/url_security.py` | Client HTTP anti-SSRF : pinned_fetch, PinnedIPAdapter, suivi de redirects | ~273 |
| `apps/api/plane/utils/ip_address.py` | Résolution DNS, validation IP, blocage des réseaux internes | ~206 |

## Schéma BDD

### Table `webhooks`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK | Hérité de BaseModel |
| `workspace_id` | UUID | FK → workspaces | CASCADE |
| `url` | URLField(1024) | Validé via validate_schema + validate_domain | Doit être HTTP/HTTPS, pas localhost/127.0.0.1 |
| `is_active` | BooleanField | default=True | Mis à False automatiquement après 5 échecs |
| `secret_key` | CharField(255) | default=generate_token | Format `plane_wh_<uuid_hex>` |
| `project` | BooleanField | default=False | Abonnement aux événements projet |
| `issue` | BooleanField | default=False | Abonnement aux événements issue |
| `module` | BooleanField | default=False | Abonnement aux événements module + module_issue |
| `cycle` | BooleanField | default=False | Abonnement aux événements cycle + cycle_issue |
| `issue_comment` | BooleanField | default=False | Abonnement aux commentaires |
| `is_internal` | BooleanField | default=False | Usage non déterminé |
| `version` | CharField(50) | default="v1" | Usage différencié non implémenté |
| `created_at`, `updated_at` | DateTimeField | auto | Hérités de BaseModel |
| `deleted_at` | DateTimeField | nullable | Soft delete |

Contrainte d'unicité : `(workspace, url)` quand `deleted_at IS NULL`.

### Table `webhook_logs`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID | PK |
| `workspace_id` | UUID | FK → workspaces (CASCADE) |
| `webhook` | UUIDField | Référence UUID non-FK (conservation des logs après suppression du webhook) |
| `event_type` | TextField | Type d'événement déclenché |
| `request_method` | CharField(10) | Méthode HTTP utilisée |
| `request_headers` | TextField | En-têtes de la requête envoyée |
| `request_body` | TextField | Corps de la requête envoyée |
| `response_status` | TextField | Code HTTP de réponse |
| `response_headers` | TextField | En-têtes de réponse reçus |
| `response_body` | TextField | Corps de réponse reçu |
| `retry_count` | PositiveSmallIntegerField | Numéro de la tentative |

Note : `webhook` est un `UUIDField` sans FK Django — les logs survivent à la suppression du webhook parent.

### Table `project_webhooks`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID | PK |
| `project_id` | UUID | FK → projects (CASCADE) |
| `webhook_id` | UUID | FK → webhooks (CASCADE) |
| `deleted_at` | DateTimeField | nullable |

Contrainte d'unicité : `(project, webhook)` quand `deleted_at IS NULL`. Non utilisée par la logique de dispatch actuelle.

## API / Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `POST` | `/api/workspaces/<slug>/webhooks/` | Créer un webhook | ADMIN workspace |
| `GET` | `/api/workspaces/<slug>/webhooks/` | Lister les webhooks du workspace | ADMIN workspace |
| `GET` | `/api/workspaces/<slug>/webhooks/<uuid:pk>/` | Détail d'un webhook | ADMIN workspace |
| `PATCH` | `/api/workspaces/<slug>/webhooks/<uuid:pk>/` | Modifier un webhook (partiel) | ADMIN workspace |
| `DELETE` | `/api/workspaces/<slug>/webhooks/<uuid:pk>/` | Supprimer un webhook | ADMIN workspace |
| `POST` | `/api/workspaces/<slug>/webhooks/<uuid:pk>/regenerate/` | Régénérer la clé secrète | ADMIN workspace |
| `GET` | `/api/workspaces/<slug>/webhook-logs/<uuid:webhook_id>/` | Consulter les logs d'un webhook | ADMIN workspace |

Toutes les routes utilisent `@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")`.

La `secret_key` est exclue des réponses GET (listing et détail) via le paramètre `fields` du `DynamicBaseSerializer`. Elle n'est retournée que lors de la régénération (POST /regenerate/).

## Format du payload sortant

```json
{
  "event": "<type_événement>",
  "action": "create | update | delete",
  "webhook_id": "<uuid>",
  "workspace_id": "<uuid>",
  "workspace_slug": "<slug>",
  "data": { ... },
  "activity": {
    "field": "<champ modifié ou null>",
    "new_value": "<nouvelle valeur>",
    "old_value": "<ancienne valeur>",
    "actor": { ... },
    "old_identifier": null,
    "new_identifier": null
  }
}
```

Pour les événements `deleted`, `data` contient uniquement `{"id": "<uuid>"}`.

## En-têtes HTTP sortants

| En-tête | Valeur | Description |
|---------|--------|-------------|
| `Content-Type` | `application/json` | Format du payload |
| `User-Agent` | `Autopilot` | Identifiant de l'appelant |
| `X-Plane-Delivery` | UUID v4 aléatoire | Identifiant unique de livraison |
| `X-Plane-Event` | Type d'événement | Ex : `issue`, `project` |
| `X-Plane-Signature` | HMAC-SHA256 hex | Signature du payload JSON entier |

## Signature HMAC-SHA256

La signature est calculée dans `webhook_send_task` :

```python
hmac_signature = hmac.new(
    webhook.secret_key.encode("utf-8"),
    json.dumps(payload).encode("utf-8"),
    hashlib.sha256,
)
signature = hmac_signature.hexdigest()
headers["X-Plane-Signature"] = signature
```

La signature couvre le payload JSON complet (tous les champs, y compris `event`, `action`, `webhook_id`, `workspace_id`, `workspace_slug`, `data`, `activity`). Le JSON est sérialisé avec `DjangoJSONEncoder` avant signature.

## Protection anti-SSRF

La protection se déploie en deux couches :

**Couche 1 — Validation à la création/modification (WebhookSerializer)**
- `validate_schema` et `validate_domain` (modèle) : refusent les schémas non-HTTP/HTTPS et `localhost`/`127.0.0.1`.
- `validate_url` (ip_address.py) : résout le DNS et bloque les IPs privées/internes.
- Vérification contre `WEBHOOK_DISALLOWED_DOMAINS` (empêche de pointer vers l'instance Plane elle-même).
- Les hosts dans `WEBHOOK_ALLOWED_HOSTS` contournent le blocage IP (services internes de confiance).

**Couche 2 — Envoi (pinned_fetch)**
- Résolution DNS unique : l'IP résolue à la validation est celle utilisée pour la connexion (pas de second lookup).
- La connexion socket est établie directement vers l'IP littérale (`PinnedIPAdapter`) — urllib3 n'effectue pas de résolution DNS.
- Le `Host` header et le TLS SNI/vérification de certificat utilisent toujours le hostname original.
- Les redirections ne sont jamais suivies (`allow_redirects=False`) — un `Location: http://169.254.169.254/` ne peut pas être exploité.
- Les proxies ambiants sont désactivés (`session.trust_env = False`, `proxies={"http": None, "https": None}`).
- Un `ValueError` (IP interne détectée au moment de l'envoi) enregistre un log mais ne déclenche pas de retry ni de désactivation automatique.

Réseaux bloqués explicitement dans `_BLOCKED_NETWORKS` (au-delà des ranges `is_private`/`is_loopback` Python) :
- `0.0.0.0/8`, `100.64.0.0/10` (CGN), `169.254.0.0/16` (link-local + metadata cloud), `255.255.255.255/32`
- IPv6 : `::ffff:0:0/96`, `64:ff9b::/96`, `64:ff9b:1::/48`, `2002::/16` (6to4), `2001::/32` (Teredo), `fec0::/10`

## Retry et désactivation automatique

`webhook_send_task` est configuré avec :
- `autoretry_for=(requests.RequestException,)` — retry uniquement sur erreurs réseau
- `retry_backoff=600` secondes, `retry_jitter=True`
- `max_retries=5`

Quand `self.request.retries >= max_retries` :
1. `Webhook.objects.filter(pk=webhook.id).update(is_active=False)`
2. `send_webhook_deactivation_email.delay(webhook_id, receiver_id=webhook.created_by_id, ...)`

Les erreurs SSRF (`ValueError`) ne déclenchent pas de retry.

## SERIALIZER_MAPPER / MODEL_MAPPER

La tâche `webhook_activity` utilise deux dictionnaires de mappage pour résoudre dynamiquement le modèle et le serializer à partir du nom d'événement string :

| Événement | Modèle | Serializer |
|-----------|--------|-----------|
| `project` | Project | ProjectSerializer |
| `issue` | Issue | IssueExpandSerializer (avec labels + assignees prefetch) |
| `cycle` | Cycle | CycleSerializer |
| `module` | Module | ModuleSerializer |
| `cycle_issue` | CycleIssue | CycleIssueSerializer |
| `module_issue` | ModuleIssue | ModuleIssueSerializer |
| `issue_comment` | IssueComment | IssueCommentSerializer |
| `user` | User | UserLiteSerializer |
| `intake_issue` | IntakeIssue | IntakeIssueSerializer |

## Patterns identifiés

- **Tâche Celery avec retry automatique (`bind=True`, `autoretry_for`)** — pattern standard Celery pour les envois HTTP avec backoff.
- **Dynamic dispatch via dictionnaires de mappage** — `SERIALIZER_MAPPER` / `MODEL_MAPPER` permettent d'ajouter des types d'événements sans modifier la logique de dispatch.
- **Soft delete avec contrainte d'unicité conditionnelle** — `UniqueConstraint` avec `condition=Q(deleted_at__isnull=True)` (pattern partagé avec les autres modèles du projet).
- **DynamicBaseSerializer avec `fields` parameter** — permet d'exclure `secret_key` des réponses GET sans créer plusieurs serializers.
- **UUID non-FK pour WebhookLog.webhook** — choix délibéré pour conserver les logs après suppression du webhook parent.

## Décisions documentées ici (non-ADR)

- **Flags booléens d'abonnement** : les abonnements aux événements sont des champs booléens distincts (`project`, `issue`, `module`, `cycle`, `issue_comment`) plutôt qu'une liste ou un champ JSON. Cela simplifie les filtres Django (`webhooks.filter(issue=True)`) mais rend l'ajout d'un nouveau type d'événement plus coûteux (migration + code). Impact limité au modèle Webhook et à la task de dispatch — non-ADR (Q3=NON).
- **`secret_key` exclue des réponses GET** : la clé n'est retournée que par l'endpoint POST /regenerate/ via le serializer complet. Convention de sécurité appliquée au niveau serializer via `DynamicBaseSerializer(fields=(...))`. Impact mono-module — non-ADR (AP-6).
- **Auto-désactivation après 5 retries** : comportement implémenté directement dans le handler d'exception Celery. Le seuil est codé en dur (`max_retries=5`). Non-ADR (AP-3 — heuristique d'implémentation).
- **`ProjectWebhook` non utilisé** : le modèle existe mais n'est pas câblé dans le dispatch ni dans les vues. Probablement une feature incomplète.

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| — | — | Absent (aucun fichier de test webhook trouvé dans `apps/api/`) |

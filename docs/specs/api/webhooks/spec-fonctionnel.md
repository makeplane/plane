# Spec Fonctionnelle — Webhooks sortants [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/webhooks        |
| Version    | 0.1.0               |
| Date       | 2026-06-30          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-121](../../../adr/RETRO-121-webhook-hmac-sha256-signature.md) | Signature HMAC-SHA256 des payloads webhook | Documenté (rétro) |
| [RETRO-122](../../../adr/RETRO-122-webhook-ssrf-dns-pinning.md) | Protection anti-SSRF par DNS-pinning (webhooks sortants) | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

Le module webhooks permet aux workspaces Plane de s'abonner à des événements internes (création/modification/suppression d'issues, commentaires, projets, cycles, modules) et de les pousser en temps réel vers des URLs externes configurées par les administrateurs. Ce mécanisme d'intégration permet aux outils tiers de réagir aux changements d'état de Plane sans polling.

## Règles métier (déduites du code)

1. Seuls les utilisateurs avec le rôle ADMIN au niveau workspace peuvent créer, modifier, supprimer ou consulter les webhooks d'un workspace.
2. L'URL cible d'un webhook doit utiliser le schéma HTTP ou HTTPS — les autres schémas sont refusés.
3. Les URLs pointant vers `localhost` ou `127.0.0.1` sont refusées au niveau du modèle. Les adresses IP privées, de loopback, link-local (dont `169.254.169.254`, le point d'accès aux métadonnées cloud), multicast et les réseaux de transition IPv6 sont également bloquées.
4. Une URL doit être unique par workspace (contrainte d'unicité avec soft delete : deux webhooks sur la même URL ne peuvent coexister si aucun n'est supprimé).
5. Chaque webhook dispose d'une clé secrète (`plane_wh_` + UUID hex) générée automatiquement à la création. Cette clé est utilisée pour signer les payloads sortants avec HMAC-SHA256.
6. Un administrateur peut régénérer la clé secrète d'un webhook existant via un endpoint dédié. La clé précédente est immédiatement invalidée.
7. La clé secrète n'est jamais retournée dans les réponses de listing ou de consultation individuelle — elle n'est visible qu'au moment de la régénération.
8. Un webhook s'abonne sélectivement à des types d'événements : `project`, `issue`, `cycle`, `module`, `issue_comment`. Seuls les événements cochés déclenchent un push.
9. Les webhooks peuvent être activés ou désactivés (`is_active`). Un webhook désactivé ne reçoit aucun événement.
10. Après 5 tentatives d'envoi consécutives échouées (erreurs réseau), le webhook est automatiquement désactivé et l'administrateur créateur reçoit un email de notification.
11. Les tentatives d'envoi sont relancées avec backoff de 600 secondes et jitter aléatoire, pour un maximum de 5 retries.
12. Un log complet de chaque tentative d'envoi (requête + réponse + statut + nombre de retry) est conservé dans `WebhookLog`.
13. Pour les événements de suppression (`deleted`), le payload contient uniquement l'identifiant de l'objet supprimé, et non sa sérialisation complète.
14. Les événements de type `module_issue` et `cycle_issue` sont routés respectivement vers les webhooks abonnés à `module` et `cycle`.
15. Les redirections HTTP (3xx) ne sont jamais suivies lors de l'envoi — un `Location` ne peut pas rediriger vers une adresse interne.

## Cas d'usage (déduits)

### CU-001 — Création d'un webhook

Un administrateur workspace configure un webhook en fournissant une URL externe et en sélectionnant les types d'événements à recevoir. L'URL est validée contre les règles anti-SSRF. Une clé secrète est générée automatiquement.

### CU-002 — Réception d'un événement

Quand une action est effectuée sur un objet Plane abonné (ex : création d'une issue), la tâche Celery `webhook_activity` est déclenchée. Elle filtre les webhooks actifs du workspace abonnés à ce type d'événement, puis déclenche `webhook_send_task` pour chacun. Le payload est signé avec HMAC-SHA256 et envoyé en POST vers l'URL cible.

### CU-003 — Vérification de l'authenticité côté consommateur

Le consommateur externe lit l'en-tête `X-Plane-Signature` du POST reçu et vérifie qu'il correspond au HMAC-SHA256 du corps JSON calculé avec la clé secrète partagée. Si la vérification échoue, la requête provient d'un expéditeur non légitime.

### CU-004 — Régénération de la clé secrète

Un administrateur peut régénérer la clé secrète d'un webhook (ex. : compromission suspectée). La nouvelle clé remplace immédiatement l'ancienne.

### CU-005 — Désactivation automatique après échecs répétés

Si les 5 tentatives d'envoi échouent (timeout, connexion refusée, erreur réseau), le webhook est automatiquement marqué `is_active=False` et l'administrateur créateur reçoit un email d'alerte avec un lien vers la page de configuration du webhook.

### CU-006 — Consultation des logs

Un administrateur peut consulter l'historique des tentatives d'envoi d'un webhook : méthode, en-têtes, corps, statut de réponse, nombre de retries.

## Dépendances

- `plane.db.models.Webhook`, `WebhookLog`, `ProjectWebhook` — modèles de persistance
- `plane.app.permissions.allow_permission` (ROLE.ADMIN, level WORKSPACE) — contrôle d'accès
- `plane.bgtasks.webhook_task.webhook_activity` — déclenchée par les signaux d'activité des autres features
- `plane.bgtasks.webhook_task.model_activity` — point d'entrée pour les activités CRUD sur les modèles
- `plane.utils.url_security.pinned_fetch` — client HTTP anti-SSRF (partageable)
- `plane.utils.ip_address.resolve_and_validate`, `validate_url` — validation DNS + blocage des IPs internes
- `plane.license.utils.instance_value.get_email_configuration` — configuration SMTP pour les emails de désactivation
- Celery + RabbitMQ — exécution asynchrone des tâches d'envoi
- `plane.api.serializers` — sérialisation des objets métier dans le payload (IssueExpandSerializer, CycleSerializer, etc.)

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- `ProjectWebhook` est défini comme modèle (association webhook ↔ projet) mais n'est ni utilisé dans les vues ni dans la task de dispatch. Son rôle opérationnel reste incertain — il pourrait être une feature incomplète ou un artefact de conception antérieure.
- La variable `version = CharField(default="v1")` sur le modèle `Webhook` suggère une gestion de versionnage du format payload, mais aucune logique de dispatch différencié par version n'a été trouvée dans le code actuel.
- `is_internal = BooleanField(default=False)` sur `Webhook` n'est jamais utilisé dans les vues ni dans la task — son usage prévu est inconnu.
- Les settings `WEBHOOK_ALLOWED_IPS` et `WEBHOOK_ALLOWED_HOSTS` sont référencés dans le code mais leur valeur par défaut n'a pas été vérifiée dans `settings/common.py`.
- `WEBHOOK_DISALLOWED_DOMAINS` est utilisé dans le serializer pour bloquer les domaines qui correspondent au domaine de l'instance Plane elle-même — le périmètre exact (sous-domaines inclus) mérite confirmation.
- L'email de désactivation est envoyé au `created_by` du webhook — comportement à valider si le créateur n'est plus ADMIN.

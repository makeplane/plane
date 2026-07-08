# Spec Technique — notifications

| Champ         | Valeur                    |
|---------------|---------------------------|
| Module        | api/notifications         |
| Version       | 0.1.0                     |
| Date          | 2026-06-30                |
| Source        | Rétro-ingénierie          |

---

## Architecture du module

Le module notifications est organisé en trois couches distinctes :

**Couche modèle (BDD)** — trois entités : `Notification` (notification in-app persistée), `UserNotificationPreference` (préférences par utilisateur), `EmailNotificationLog` (table de buffering pour l'envoi email asynchrone).

**Couche API REST** — quatre vues DRF exposant les opérations CRUD et d'état sur les notifications in-app et les préférences. Toutes les routes sont scoped par workspace slug sauf les préférences utilisateur.

**Couche Celery (workers)** — deux tâches asynchrones :
- `notification_task.notifications` : déclenchée par `issue_activities_task` après chaque batch d'activités. Produit les `Notification` in-app et les `EmailNotificationLog`.
- `email_notification_task.stack_email_notification` : tâche périodique (toutes les 5 minutes via Celery Beat) qui dépile les `EmailNotificationLog` non traités et déclenche `send_email_notification` par issue+receiver.

Le flux complet est :
```
issue_activities_task.delay()
  → notifications.delay()
      → Notification.bulk_create()          # in-app
      → EmailNotificationLog.bulk_create()  # buffering email
         ↑ (toutes les 5 min)
  ← stack_email_notification()
      → send_email_notification.delay()     # un par issue+receiver
          → Redis lock (anti-doublon)
          → SMTP send (django EmailMultiAlternatives)
          → EmailNotificationLog.update(sent_at=now())
```

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/notification.py` | Modèles ORM : Notification, UserNotificationPreference, EmailNotificationLog | ~150 |
| `apps/api/plane/app/views/notification/base.py` | Vues DRF : NotificationViewSet, UnreadNotificationEndpoint, MarkAllReadNotificationViewSet, UserNotificationPreferenceEndpoint | ~314 |
| `apps/api/plane/app/urls/notification.py` | Routage URL des endpoints notifications | ~52 |
| `apps/api/plane/app/serializers/notification.py` | Sérialiseurs DRF : NotificationSerializer, UserNotificationPreferenceSerializer | ~30 |
| `apps/api/plane/bgtasks/notification_task.py` | Tâche Celery `notifications` : parsing mentions, génération bulk in-app + email logs | ~674 |
| `apps/api/plane/bgtasks/email_notification_task.py` | Tâches Celery `stack_email_notification` et `send_email_notification` : dépilage et envoi SMTP | ~307 |
| `apps/api/plane/bgtasks/cleanup_task.py` | Tâche `delete_email_notification_logs` : nettoyage des logs expirés | ~179 |
| `apps/api/templates/emails/notifications/issue-updates.html` | Template HTML de l'email de notification d'issue | — |
| `apps/api/plane/celery.py` | Enregistrement de `stack_email_notification` dans le beat schedule (toutes les 5 min) et `delete_email_notification_logs` (UTC 02:45) | ~119 |
| `apps/api/plane/db/migrations/0056_usernotificationpreference_emailnotificationlog.py` | Migration initiale UserNotificationPreference + EmailNotificationLog | — |
| `apps/api/plane/db/migrations/0111_notification_notif_receiver_status_idx_and_more.py` | Ajout des index composites sur la table notifications | — |

---

## Schéma BDD

### Table `notifications`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Hérité de BaseModel |
| `workspace_id` | UUID | FK → Workspace CASCADE | Scope workspace |
| `project_id` | UUID | FK → Project CASCADE, nullable | Projet concerné |
| `entity_identifier` | UUID | nullable | UUID de l'entité (issue) |
| `entity_name` | varchar(255) | | Type d'entité (ex. `"issue"`) |
| `title` | text | | Titre textuel de l'activité |
| `message` | JSONField | nullable | Message structuré (mentions) |
| `message_html` | text | default `<p></p>` | Version HTML du message |
| `message_stripped` | text | nullable | Texte brut du message |
| `sender` | varchar(255) | | Identifiant de l'origine (ex. `in_app:issue_activities:mentioned`) |
| `triggered_by_id` | UUID | FK → User SET_NULL, nullable | Utilisateur à l'origine de l'action |
| `receiver_id` | UUID | FK → User CASCADE | Destinataire de la notification |
| `read_at` | DateTimeField | nullable | Horodatage de lecture |
| `snoozed_till` | DateTimeField | nullable | Date de remise à plus tard |
| `archived_at` | DateTimeField | nullable | Horodatage d'archivage |
| `created_at` / `updated_at` | DateTime | | Hérités de BaseModel |

**Index** :
- `notif_entity_identifier_idx` : `(entity_identifier)`
- `notif_entity_name_idx` : `(entity_name)`
- `notif_read_at_idx` : `(read_at)`
- `notif_entity_idx` : `(receiver, read_at)`
- `notif_receiver_status_idx` : `(receiver, workspace, read_at, created_at)`
- `notif_receiver_entity_idx` : `(receiver, workspace, entity_name, read_at)`
- `notif_receiver_state_idx` : `(receiver, workspace, snoozed_till, archived_at)`
- `notif_receiver_sender_idx` : `(receiver, workspace, sender)`
- `notif_entity_lookup_idx` : `(workspace, entity_identifier, entity_name)`

### Table `user_notification_preferences`

| Colonne | Type | Default | Description |
|---------|------|---------|-------------|
| `user_id` | UUID | FK → User CASCADE | Utilisateur propriétaire |
| `workspace_id` | UUID | FK → Workspace CASCADE, nullable | Scope workspace (usage à clarifier) |
| `project_id` | UUID | FK → Project CASCADE, nullable | Scope projet (usage à clarifier) |
| `property_change` | boolean | `True` | Changements de propriétés |
| `state_change` | boolean | `True` | Changements d'état |
| `comment` | boolean | `True` | Commentaires |
| `mention` | boolean | `True` | Mentions |
| `issue_completed` | boolean | `True` | Issue passée en état "completed" |

Préférences email par défaut (fonction `get_default_preference`) — format JSON legacy potentiellement distinct des colonnes booléennes :
```json
{
  "property_change": {"email": true},
  "state": {"email": true},
  "comment": {"email": true},
  "mentions": {"email": true}
}
```

### Table `email_notification_logs`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `receiver_id` | UUID | FK → User CASCADE | Destinataire |
| `triggered_by_id` | UUID | FK → User CASCADE | Acteur déclencheur |
| `entity_identifier` | UUID | nullable | UUID de l'issue |
| `entity_name` | varchar(255) | | Type d'entité (ex. `"issue"`) |
| `data` | JSONField | nullable | Payload complet de l'activité |
| `entity` | varchar(200) | | Nom de l'entité (redondant ?) |
| `old_value` | varchar(300) | nullable | Ancienne valeur |
| `new_value` | varchar(300) | nullable | Nouvelle valeur |
| `processed_at` | DateTimeField | nullable | Horodatage de traitement par `stack_email_notification` |
| `sent_at` | DateTimeField | nullable | Horodatage d'envoi SMTP effectif |

---

## API / Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/workspaces/{slug}/users/notifications/` | Liste paginée des notifications in-app (filtres: snoozed, archived, read, type, mentioned) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `GET` | `/api/workspaces/{slug}/users/notifications/{pk}/` | Détail d'une notification | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `PATCH` | `/api/workspaces/{slug}/users/notifications/{pk}/` | Mise à jour (snoozed_till uniquement) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `DELETE` | `/api/workspaces/{slug}/users/notifications/{pk}/` | Suppression | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `POST` | `/api/workspaces/{slug}/users/notifications/{pk}/read/` | Marquer comme lu (`read_at = now()`) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `DELETE` | `/api/workspaces/{slug}/users/notifications/{pk}/read/` | Marquer comme non lu (`read_at = null`) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `POST` | `/api/workspaces/{slug}/users/notifications/{pk}/archive/` | Archiver (`archived_at = now()`) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `DELETE` | `/api/workspaces/{slug}/users/notifications/{pk}/archive/` | Désarchiver (`archived_at = null`) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `GET` | `/api/workspaces/{slug}/users/notifications/unread/` | Compteurs de non-lus (total + mentions séparées) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `POST` | `/api/workspaces/{slug}/users/notifications/mark-all-read/` | Marquer toutes les notifs comme lues (filtrable par type) | ADMIN / MEMBER / GUEST (WORKSPACE) |
| `GET` | `/api/users/me/notification-preferences/` | Préférences de notification de l'utilisateur courant | Authentifié |
| `PATCH` | `/api/users/me/notification-preferences/` | Mise à jour partielle des préférences | Authentifié |

**Paramètres de filtrage `GET /notifications/`** :
- `snoozed` : `"true"` / `"false"` (défaut `"false"`)
- `archived` : `"true"` / `"false"` (défaut `"false"`)
- `read` : `"true"` / `"false"` / absent (toutes)
- `type` : `"all"` / `"subscribed"` / `"assigned"` / `"created"` (séparable par virgule)
- `mentioned` : `true` / absent
- `per_page` + `cursor` : activation de la pagination

**Annotations retournées dans `NotificationSerializer`** :
- `is_inbox_issue` / `is_intake_issue` : booléen indiquant si l'issue est en statut intake non final (0, 2, -2)
- `is_mentioned_notification` : booléen si le `sender` contient `"mentioned"`

---

## Patterns identifiés

- **Shared Celery Task** (`@shared_task`) : les deux tâches asynchrones sont enregistrées via le mécanisme standard Celery, autodiscovered depuis `plane/settings/common.py`.
- **Bulk create avec `batch_size=100`** : toutes les insertions en masse (Notification, EmailNotificationLog, IssueSubscriber) utilisent `bulk_create` avec batching pour limiter la taille des requêtes SQL.
- **Pipeline buffering email** : découplage intentionnel entre la détection d'activité (synchrone dans le worker) et l'envoi SMTP (asynchrone toutes les 5 min). Permet le regroupement (digest) des modifications par issue et par acteur.
- **Redis lock pour déduplication** : clé composée `send_email_notif_{issue_id}_{receiver_id}_{ids_str}` avec expiration 300s pour garantir l'idempotence en cas de workers concurrents.
- **Parse HTML mentions avec BeautifulSoup** : extraction des `<mention-component entity_name="user_mention" entity_identifier="...">` depuis le HTML des descriptions et commentaires.
- **Annotation computed fields sur queryset** : `is_inbox_issue`, `is_intake_issue`, `is_mentioned_notification` sont calculés via `annotate(Exists(...))` et `annotate(Case(When(...)))` plutôt que stockés.
- **Read replica opt-in** : `UnreadNotificationEndpoint` positionne `use_read_replica = True` pour les lectures de compteurs, pattern commun à plusieurs endpoints de type "read-heavy".
- **`@allow_permission` decorator** : toutes les actions sont protégées par le décorateur RBAC Plane, niveau `WORKSPACE`, acceptant les rôles ADMIN, MEMBER, GUEST.
- **Soft delete hérité de BaseModel** : les notifications sont supprimables via l'endpoint `DELETE` standard (destroy DRF), hérité de BaseViewSet.

## Décisions techniques documentées (rejetées comme ADR)

### 1. Pipeline email en deux étapes avec buffering via `EmailNotificationLog`

Les emails ne sont pas envoyés directement lors de la création d'activité. Une table intermédiaire `EmailNotificationLog` joue le rôle de buffer. Une tâche périodique (toutes les 5 minutes) dépile ces logs, les regroupe par receiver+issue, et déclenche l'envoi SMTP. Cela permet un effet de digest (plusieurs modifications regroupées en un seul email) et découple la latence SMTP du traitement des activités.

Rejet ADR : Q2=NON (le pattern est lisible directement dans le code, aucune intention architecturale non déductible).

### 2. Lock Redis anti-doublon dans `send_email_notification`

Avant d'envoyer un email, la tâche acquiert un verrou Redis avec `nx=True` (set-if-not-exists) et une expiration de 300 secondes. La clé est dérivée de `issue_id + receiver_id + sorted(email_notification_ids)`. Si le verrou est déjà pris (doublon concurrentiel), l'email est silencieusement ignoré. Le verrou est libéré après envoi ou en cas d'exception.

Rejet ADR : AP-3 (heuristique d'implémentation locale à la tâche email).

### 3. URL de base de l'app stockée en Redis par `issue_id`

La tâche `send_email_notification` lit `redis_instance().get(str(issue_id))` pour obtenir l'URL de base (`base_api`) à inclure dans les emails. Si la clé est absente, l'email est silencieusement abandonné. L'origine et la population de cette clé sont externes à ce module (non identifiées dans les fichiers analysés).

Rejet ADR : AP-3 (mécanisme interne non architectural) + zone d'incertitude (voir spec-fonctionnel.md).

### 4. `UserNotificationPreference` à FK workspace/project nullable non utilisées

Le modèle possède des FK optionnelles vers Workspace et Project, mais la vue n'expose et ne filtre que les préférences globales par utilisateur. Ces FK semblent être une infrastructure préparée pour un futur scoping par workspace/projet des préférences, non encore exploitée.

Rejet ADR : AP-7 (détail de schéma non architectural) + zone d'incertitude.

### 5. Catégorisation du sender en chaîne littérale

Le champ `sender` de la table `notifications` encode à la fois le canal (`in_app`) et la catégorie de déclenchement (`issue_activities:mentioned`, `issue_activities:assigned`, etc.) dans une chaîne de texte libre. Le filtrage "mention" en vue s'appuie sur `sender__icontains="mentioned"`, ce qui est fragile face à une évolution des valeurs.

Rejet ADR : AP-6 (convention de format de champ) — à documenter comme dette technique.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `apps/api/plane/tests/unit/bg_tasks/test_cleanup_task.py` | La tâche `delete_email_notification_logs` (via test de la tâche générique de nettoyage) | Existant |
| Tests pour `notification_task`, `email_notification_task`, vues notification | — | Absent |

La couverture du module notifications est très faible : seule la tâche de nettoyage des logs est testée. Les tâches de génération de notifications et d'envoi email, ainsi que les vues REST, ne disposent d'aucun test identifié.

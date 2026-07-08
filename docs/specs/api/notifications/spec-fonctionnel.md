# Spec Fonctionnelle — notifications [DRAFT — à valider par le dev]

| Champ      | Valeur                    |
|------------|---------------------------|
| Module     | api/notifications         |
| Version    | 0.1.0                     |
| Date       | 2026-06-30                |
| Auteur     | retro-documenter          |
| Statut     | DRAFT                     |
| Source     | Rétro-ingénierie          |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

Aucun ADR RETRO créé pour cette feature (tous les candidats ont été rejetés — voir rapport final). Les décisions techniques sont documentées dans `spec-technique.md`.

---

## Contexte et objectif

Le module `notifications` gère l'ensemble des alertes destinées aux membres d'un workspace lors d'activités sur les issues : changements d'état, propriétés, commentaires, mentions. Il produit deux canaux de notification distincts : les notifications in-app (persistées en base, consultables via API REST) et les emails (envoyés de façon asynchrone via un pipeline Celery à deux étapes).

L'objectif est de tenir les utilisateurs informés des changements sur les issues auxquelles ils sont abonnés, assignés ou dont ils sont créateurs, tout en respectant leurs préférences de notification individuelles.

---

## Règles métier (déduites du code)

1. **Déclenchement sur activité issue uniquement** : les notifications ne sont générées que pour les activités de type `issue.*`. Les activités `cycle.*`, `module.*`, `issue_reaction.*`, `comment_reaction.*`, `issue_vote.*`, `issue_draft.*` sont explicitement exclues.

2. **L'acteur ne se notifie pas lui-même** : l'utilisateur à l'origine de l'action est systématiquement exclu de la liste des destinataires, que ce soit en tant que subscriber, assignee, ou mentionné.

3. **Quatre catégories de destinataires** :
   - Les **abonnés** de l'issue (IssueSubscriber), hors créateur et assignees — sender `in_app:issue_activities:subscribed`
   - Le **créateur** de l'issue s'il est subscriber — sender `in_app:issue_activities:created`
   - Les **assignees** de l'issue s'ils sont subscribers (et que le créateur n'est pas lui-même assignee) — sender `in_app:issue_activities:assigned`
   - Les utilisateurs **mentionnés** dans la description ou dans les commentaires — sender `in_app:issue_activities:mentioned`

4. **Auto-abonnement de l'acteur** : si le flag `subscriber` est positionné à `true` lors du déclenchement de la tâche, l'acteur est ajouté automatiquement comme abonné à l'issue (via `get_or_create`).

5. **Les mentionnés deviennent abonnés** : tout utilisateur nouvellement mentionné dans la description ou dans un commentaire (qui n'est pas déjà subscriber, assignee ou créateur, et qui est membre actif du projet) est ajouté en tant que subscriber de l'issue.

6. **Filtrage par préférences utilisateur pour les emails** : pour chaque destinataire, un email n'est enqueue que si la préférence correspondante est activée :
   - Changement d'état → préférence `state_change`
   - Issue complétée → préférence `issue_completed` (état avec `group="completed"`)
   - Commentaire → préférence `comment`
   - Mention → préférence `mention`
   - Toute autre propriété → préférence `property_change`

7. **Pas de notification pour les mises à jour de description** : l'activité dont le `field` vaut `"description"` est explicitement ignorée pour la génération des notifications in-app et emails des abonnés. Les mentions dans la description donnent lieu à des notifications de type "mention" distinctes.

8. **Pas de notification pour les issues hors scope** : si l'activité concerne une issue liée (ex. relation "blocking/blocked by"), seules les activités dont l'`issue_detail.id` correspond à l'issue courante génèrent des notifications.

9. **Filtrage par membres actifs du projet** : les destinataires (abonnés, mentionnés) doivent être membres actifs du projet (`is_active=True`) pour recevoir des notifications.

10. **Les notifications in-app sont scopées par workspace** : chaque notification est attachée à un workspace et un receiver. La visibilité est limitée au workspace d'appartenance de l'issue.

11. **Pipeline email à deux étapes avec buffering** : les emails ne sont pas envoyés directement. La tâche `notifications` alimente une table de log `EmailNotificationLog`. Une tâche Celery Beat (`stack_email_notification`) tourne toutes les 5 minutes et regroupe les logs non traités par receiver et par issue, puis délègue l'envoi à `send_email_notification`.

12. **Déduplication email via lock Redis** : la tâche `send_email_notification` acquiert un verrou Redis (clé composée de l'issue_id, du receiver_id et des IDs de notifications) pour éviter l'envoi en double en cas de concurrence entre workers.

13. **URL de base de l'app récupérée depuis Redis** : `send_email_notification` lit la clé Redis `{issue_id}` pour construire les URLs contenues dans l'email (liens vers l'issue, le projet, les préférences). Si la clé est absente, l'email n'est pas envoyé.

14. **Rétention des logs email** : les `EmailNotificationLog` ayant un `sent_at` antérieur à la fenêtre de rétention configurée (`EMAIL_LOG_RETENTION_DAYS`) sont supprimés chaque nuit (UTC 02:45) par une tâche de nettoyage.

15. **Gestion des préférences par défaut** : la fonction `get_default_preference()` définit les préférences email activées par défaut pour les 4 catégories (property_change, state, comment, mentions).

---

## Cas d'usage (déduits)

### CU-001 — Notification de modification d'une issue

**Acteur** : membre du workspace effectuant une modification sur une issue.

**Déclencheur** : la tâche Celery `issue_activities_task` crée les activités et appelle `notifications.delay(...)` si `notification=True`.

**Flux principal** :
1. La tâche `notifications` est déclenchée de façon asynchrone.
2. Elle calcule la liste des destinataires (abonnés, assignees, créateur) en excluant l'acteur.
3. Elle crée en bulk les enregistrements `Notification` (in-app) pour tous les destinataires éligibles.
4. Pour les destinataires dont la préférence email correspond au type d'activité, elle crée en bulk des `EmailNotificationLog`.
5. Toutes les 5 minutes, `stack_email_notification` récupère les logs non traités, les regroupe par receiver+issue, et déclenche `send_email_notification.delay(...)`.
6. `send_email_notification` construit le payload email (template HTML + texte brut), envoie via SMTP configuré dans l'instance, et met à jour le log (`sent_at`).

### CU-002 — Mention d'un utilisateur dans une description ou un commentaire

**Flux principal** :
1. La tâche `notifications` parse le HTML de la description et des commentaires (via BeautifulSoup, balises `<mention-component entity_name="user_mention">`).
2. Elle calcule le diff entre l'ancienne et la nouvelle version pour identifier les nouvelles mentions.
3. Les utilisateurs nouvellement mentionnés (membres actifs, non déjà abonnés/assignés/créateurs) sont ajoutés en tant que subscribers.
4. Une notification in-app de type "mentioned" est créée pour chaque mentionné.
5. Si la préférence `mention` est activée, un `EmailNotificationLog` est créé.

### CU-003 — Consultation des notifications in-app

**Acteur** : membre du workspace.

**Flux principal** :
1. Le client appelle `GET /api/workspaces/{slug}/users/notifications/` avec filtres optionnels (snoozed, archived, read, type, mentioned).
2. La vue retourne les notifications paginables filtrées, avec annotation `is_intake_issue` (issue en statut intake non final).
3. Les compteurs non lus sont accessibles via `GET /api/workspaces/{slug}/users/notifications/unread/` (séparation mentions / reste).

### CU-004 — Gestion des états d'une notification

**Flux principal** :
- Marquer lu : `POST /api/workspaces/{slug}/users/notifications/{pk}/read/` → `read_at = now()`
- Marquer non lu : `DELETE /api/workspaces/{slug}/users/notifications/{pk}/read/` → `read_at = null`
- Archiver : `POST /api/workspaces/{slug}/users/notifications/{pk}/archive/` → `archived_at = now()`
- Désarchiver : `DELETE /api/workspaces/{slug}/users/notifications/{pk}/archive/` → `archived_at = null`
- Snoozer : `PATCH /api/workspaces/{slug}/users/notifications/{pk}/` → `snoozed_till = <datetime>`
- Tout marquer lu : `POST /api/workspaces/{slug}/users/notifications/mark-all-read/` (bulk update batch_size=100)

### CU-005 — Configuration des préférences de notification

**Acteur** : utilisateur authentifié.

**Flux principal** :
1. `GET /api/users/me/notification-preferences/` retourne les préférences actuelles.
2. `PATCH /api/users/me/notification-preferences/` met à jour partiellement les préférences (property_change, state_change, comment, mention, issue_completed).

---

## Dépendances

- `api/issues` — les notifications sont scopées sur des issues ; la tâche `issue_activities_task` est l'unique déclencheur de `notifications.delay()`
- `api/auth` — seuls les membres authentifiés et actifs d'un projet reçoivent des notifications
- `api/workspaces` — les notifications sont scopées par workspace ; le RBAC workspace est vérifié (`@allow_permission`)
- `api/projects` — membership projet requis pour les mentions ; `ProjectMember.is_active` est vérifié
- Celery + RabbitMQ — toute la génération et l'envoi d'emails passe par des workers asynchrones
- Redis — lock anti-doublons pour l'envoi email, stockage de l'URL de base de l'app par issue_id
- SMTP — configuration récupérée depuis le sous-système `plane/license` (instance configuration)
- `EmailNotificationLog` — table de buffering intermédiaire entre la détection d'activité et l'envoi email

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Clé Redis `{issue_id}`** : la tâche `send_email_notification` lit `ri.get(str(issue_id))` pour obtenir l'URL de base de l'app. L'origine et le moment de population de cette clé Redis ne sont pas identifiables dans les fichiers analysés. Si la clé est absente, l'email est silencieusement ignoré — ce comportement intentionnel ou non est à confirmer.
- **Préférences workspace/projet** : le modèle `UserNotificationPreference` possède des FK optionnelles vers workspace et project, mais la vue n'expose que des préférences globales utilisateur (sans scope). L'usage des FK workspace/project dans le modèle est à clarifier (fonctionnalité future ? legacy ?).
- **Champ `message` vs `title`** : les notifications pour abonnés utilisent `title=issue_activity.get("comment")`, tandis que les notifications de mention utilisent `message=`. La distinction sémantique entre ces deux champs n'est pas documentée.
- **Valeur `bulk_email_logs` avec `subscriber` en variable de boucle** : dans `notification_task.py` lignes 573-609, le receiver des `EmailNotificationLog` de mention (description) est `subscriber` (variable de la boucle extérieure) plutôt que `mention_id`. Potentiel bug à valider.
- **Rétention `EMAIL_LOG_RETENTION_DAYS`** : la valeur de ce paramètre de settings n'a pas été retrouvée dans les fichiers lus — valeur par défaut à confirmer.

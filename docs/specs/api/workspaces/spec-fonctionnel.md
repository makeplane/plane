# Spec Fonctionnelle — api/workspaces [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/workspaces      |
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
| [RETRO-011](../../../adr/RETRO-011-cascade-role-workspace-projet.md) | Cascade du rôle GUEST workspace vers tous les rôles projet | Documenté (rétro) |
| [RETRO-012](../../../adr/RETRO-012-securisation-invitation-workspace.md) | Sécurisation du flux d'invitation workspace (anti email-squat) | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

Un workspace est le conteneur racine multi-tenant de Plane. C'est l'équivalent d'une "organisation" dans d'autres outils de gestion de projet (Linear, Jira). Toute entité de Plane (projet, issue, cycle, module, page) appartient à un workspace. Un utilisateur peut appartenir à plusieurs workspaces simultanément.

Le module gère le cycle de vie complet du workspace : création, modification, suppression (soft delete), ainsi que la gestion des membres (ajout par invitation, modification de rôle, retrait, départ volontaire), les thèmes visuels personnalisés, les préférences utilisateur par workspace, et un tableau de bord d'accueil personnalisable.

---

## Règles métier (déduites du code)

1. **Slug unique et immuable pendant la vie active.** Le slug identifie le workspace dans toutes les URLs. Il est validé contre une liste de slugs réservés (RESTRICTED_WORKSPACE_SLUGS, ~50 valeurs) et contre un regex `[a-zA-Z0-9_-]+`. Longueur max : 48 caractères. Lors d'un soft delete, le slug est automatiquement modifié en `<slug>__<epoch_timestamp>` pour libérer le slug original et permettre sa réutilisation.

2. **Le créateur d'un workspace en devient automatiquement ADMIN (rôle 20).** À la création, un WorkspaceMember est créé avec `role=20` pour l'utilisateur créateur. Ce comportement est non-configurable.

3. **Trois rôles workspace : ADMIN (20), MEMBER (15), GUEST (5).** Les valeurs numériques permettent des comparaisons d'ordre (`role > 5`). Un Admin peut inviter jusqu'à son propre niveau de rôle — il ne peut pas inviter à un rôle supérieur au sien.

4. **Un ADMIN ne peut pas s'auto-modifier.** La modification de son propre rôle est interdite (membre.py ligne 81-84).

5. **Cascade rôle workspace vers rôles projet.** Quand un membre passe au rôle GUEST (5) dans le workspace, tous ses rôles dans les projets du workspace sont automatiquement abaissés à GUEST (5). Les rôles projet ne peuvent pas dépasser le rôle workspace GUEST (voir ADR RETRO-011).

6. **Invariant : au moins un ADMIN doit rester dans le workspace.** Un utilisateur ne peut pas quitter un workspace s'il est le seul ADMIN actif. Symétriquement, un ADMIN ne peut pas supprimer le dernier ADMIN.

7. **Invariant : un membre ne peut pas être supprimé s'il est le seul ADMIN d'un projet.** Avant toute suppression ou départ, une vérification vérifie qu'aucun projet du workspace ne se retrouverait sans ADMIN.

8. **La création de workspace peut être désactivée au niveau instance.** Le flag `DISABLE_WORKSPACE_CREATION` (lu depuis la configuration instance ou la variable d'environnement) bloque l'endpoint POST avec une réponse 403.

9. **Le nom du workspace ne peut pas contenir d'URL, ni être composé exclusivement de caractères non-alphanumériques.** Les validations sont dupliquées côté vue et côté serializer.

10. **Les invitations sont à usage unique.** Une fois acceptée, l'invitation est supprimée. Si l'utilisateur existait déjà (membre déactivé), son membership est réactivé avec le rôle de l'invitation. L'acceptation d'une invitation exige que l'utilisateur soit authentifié et que son email corresponde exactement à l'email invité (voir ADR RETRO-012).

11. **Soft delete généralisé sur les entités workspace.** WorkspaceMember, WorkspaceMemberInvite, Team, WorkspaceTheme utilisent tous un UniqueConstraint avec `condition=Q(deleted_at__isnull=True)` pour permettre la réinscription d'un même membre après suppression.

12. **Tableau de bord personnalisable par utilisateur.** WorkspaceHomePreference stocke l'état (activé/désactivé, ordre) de chaque widget de la page d'accueil par utilisateur et workspace. Les widgets sont auto-créés à la première consultation si absents.

---

## Cas d'usage (déduits)

### CU-001 — Création d'un workspace

**Acteur :** Utilisateur authentifié.

Un utilisateur envoie `POST /api/workspaces/` avec un nom (max 80 chars, sans URL, avec au moins un caractère alphanumérique) et un slug (max 48 chars, `[a-zA-Z0-9_-]+`, non réservé). Si la création n'est pas désactivée au niveau instance, le workspace est créé, l'utilisateur est enregistré comme ADMIN (rôle 20), et une tâche Celery `workspace_seed` initialise un projet exemple en arrière-plan. Un événement PostHog `WORKSPACE_CREATED` est tracé de façon asynchrone.

### CU-002 — Invitation de membres

**Acteur :** ADMIN ou MEMBER du workspace.

L'acteur envoie `POST /api/workspaces/<slug>/invitations/` avec une liste d'emails et de rôles. Règles : les rôles des invités ne peuvent pas dépasser le rôle de l'invitant. Si un email est déjà membre actif, la requête est rejetée. Des invitations JWT signées sont créées et des emails d'invitation sont envoyés via Celery. Un événement `USER_INVITED_TO_WORKSPACE` est tracé.

### CU-003 — Acceptation d'une invitation

**Acteur :** Utilisateur authentifié dont l'email correspond à l'invitation.

Le futur membre consulte `GET /api/workspaces/<slug>/invitations/<pk>/join/` pour voir les infos de l'invitation (sans token), puis poste `POST` avec le token. La validation vérifie que l'utilisateur est authentifié, que son email correspond, et que le token est valide. Si l'utilisateur était déjà membre (déactivé), son membership est réactivé avec le rôle de l'invitation.

### CU-004 — Modification du rôle d'un membre

**Acteur :** ADMIN du workspace.

`PATCH /api/workspaces/<slug>/members/<pk>/` modifie le rôle. Si le rôle cible est GUEST (5), tous les rôles du membre dans les projets du workspace sont automatiquement abaissés à GUEST. L'ADMIN ne peut pas modifier son propre rôle.

### CU-005 — Retrait d'un membre

**Acteur :** ADMIN du workspace.

`DELETE /api/workspaces/<slug>/members/<pk>/` désactive le membre (soft delete via `is_active=False`) dans le workspace et dans tous ses projets. Bloqué si : le membre à retirer est le seul ADMIN du workspace ou le seul ADMIN d'au moins un projet.

### CU-006 — Départ volontaire d'un workspace

**Acteur :** Tout membre actif.

`POST /api/workspaces/<slug>/members/leave/` auto-désactive le membre. Mêmes vérifications que CU-005. Les caches de session et de liste de workspaces sont invalidés.

### CU-007 — Suppression d'un workspace

**Acteur :** ADMIN du workspace.

`DELETE /api/workspaces/<slug>/` effectue un soft delete du workspace. Le slug est automatiquement suffixé d'un timestamp epoch pour libérer le slug. Les profils utilisateur référençant ce workspace comme `last_workspace_id` sont mis à jour. Un événement `WORKSPACE_DELETED` est tracé.

### CU-008 — Gestion des préférences du tableau de bord

**Acteur :** Tout membre actif.

`GET /api/workspaces/<slug>/home-preferences/` retourne les préférences de l'utilisateur, créant automatiquement les entrées manquantes. `PATCH /api/workspaces/<slug>/home-preferences/<key>/` met à jour l'état ou l'ordre d'un widget spécifique (quick_links, recents, my_stickies).

---

## Dépendances

- **api/auth** — Toutes les vues workspace requièrent une session Django authentifiée.
- **api/projects** — La cascade de rôle workspace vers projet dépend de ProjectMember. La vérification "seul ADMIN d'un projet" dépend de la table project_members.
- **Celery / RabbitMQ** — `workspace_seed` (initialisation), `workspace_invitation` (envoi emails), `track_event` (analytics PostHog) sont des tâches asynchrones.
- **Redis** — Invalidation de cache sur les endpoints membres et workspaces.
- **Instance license system** — Le flag `DISABLE_WORKSPACE_CREATION` est lu via `get_configuration_value` depuis le sous-système de licences.

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Contenu exact de `workspace_seed`** : la tâche crée un projet exemple avec des states, labels, issues, pages, cycles, modules. Le contenu exact des seeds (données JSON) n'a pas été exploré — il faudrait valider que c'est bien un projet "démo" et non des données fonctionnelles.
- **Politique de ré-invitation** : si une invitation a été refusée (`accepted=False`, `responded_at` non null), est-elle ré-envoyable ? Le code unique_together tolère cela via soft delete mais le flux exact n'est pas explicite.
- **Rôle "viewer" non documenté** : des classes de permission `WorkspaceViewerPermission` et `WorkspaceUserPermission` existent dans le code mais ne semblent pas utilisées directement dans les vues workspace. Leur rôle exact est à confirmer.
- **WorkspaceUserLink** : le modèle existe dans les serializers mais aucune vue dédiée n'a été identifiée dans ce module — les "quick links" utilisent `QuickLinkViewSet`. La distinction entre les deux est à valider.
- **Team** : le modèle `Team` est défini dans `workspace.py` mais aucune vue CRUD dédiée n'a été identifiée dans le scope de ce module. Son usage reste à clarifier.

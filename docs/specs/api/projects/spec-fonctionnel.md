# Spec Fonctionnelle — api/projects [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/projects        |
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

| ADR | Titre | Catégorie | Statut |
|-----|-------|-----------|--------|
| [RETRO-021](../../../adr/RETRO-021-rbac-trois-niveaux-projet-workspace.md) | RBAC à 3 niveaux (ADMIN/MEMBER/GUEST) avec bypass ADMIN workspace et plafonnement de rôle projet | AUTH | Documenté (rétro) |

> *Table maintenue manuellement — adr-linker ne supporte pas encore les Features multi-valeurs.*

---

## Contexte et objectif

Un projet (`Project`) est le conteneur de second niveau de Plane, situé sous un workspace. Il regroupe des issues, des cycles, des modules, des pages et un funnel d'intake. Chaque projet dispose de son propre RBAC (rôles Admin/Member/Guest), de feature flags activables (cycles, modules, pages, intake, vues), d'états personnalisés pour ses issues, et peut être exposé publiquement via un "deploy board".

Le module couvre :
- Le cycle de vie du projet (création, modification, archivage, suppression)
- La gestion des membres et de leurs rôles au niveau projet
- La gestion des états d'issue propres au projet
- Le deploy board (exposition publique)

---

## Règles métier (déduites du code)

### Gestion du projet

1. **Identifiant unique par workspace** : le champ `identifier` (12 caractères max, converti en majuscules à la sauvegarde) doit être unique au sein d'un workspace pour les projets non supprimés. Un `ProjectIdentifier` miroir est maintenu séparément.
2. **Nom unique par workspace** : le nom du projet doit être unique au sein d'un workspace pour les projets non supprimés.
3. **Réseau Secret/Public (0/2)** : un projet peut être `SECRET` (0) ou `PUBLIC` (2). Les membres avec rôle MEMBER dans le workspace voient les projets publics même sans en être membre. Les GUEST workspace ne voient que les projets dont ils sont membres.
4. **Héritage du fuseau horaire workspace** : à la création, si aucun fuseau horaire n'est fourni explicitement, le projet hérite du fuseau horaire du workspace.
5. **États par défaut à la création** : 6 états sont créés automatiquement lors de la création d'un projet (`Backlog`, `Todo`, `In Progress`, `Done`, `Cancelled`, `Triage`), chacun associé à un groupe prédéfini.
6. **Créateur automatiquement Admin** : l'utilisateur créant un projet est automatiquement ajouté comme membre ADMIN du projet.
7. **Project lead automatiquement Admin** : si un `project_lead` distinct du créateur est renseigné, il est également ajouté comme ADMIN automatiquement.
8. **Archivage** : un projet archivé (`archived_at` non null) ne peut plus être modifié. L'archivage supprime le projet des favoris des utilisateurs. Un projet archivé n'est pas récupéré par le `retrieve` standard (filtre `archived_at__isnull=True`).
9. **Suppression** : la suppression d'un projet supprime physiquement le `DeployBoard` et les `UserFavorite` associés.
10. **Intake auto-créé** : lorsque `intake_view` est activé sur un projet (via PATCH), un `Intake` par défaut est créé automatiquement s'il n'en existe pas déjà un.
11. **Feature flags** : `cycle_view`, `module_view`, `issue_views_view`, `page_view`, `intake_view`, `is_time_tracking_enabled`, `is_issue_type_enabled` sont des booléens activables individuellement par projet.
12. **Clôture et archivage automatiques** : `archive_in` et `close_in` (0–12 mois) configurent l'archivage et la clôture automatiques des issues. La valeur 0 désactive la fonctionnalité.

### Gestion des membres

13. **Rôle projet plafonné par rôle workspace** : le rôle d'un membre dans un projet ne peut pas être supérieur à son rôle dans le workspace. Un GUEST workspace ne peut pas avoir un rôle MEMBER ou ADMIN dans un projet. Un ADMIN workspace ne peut pas se voir attribuer un rôle GUEST ou MEMBER s'il est déjà ADMIN workspace.
14. **Seul un ADMIN peut ajouter/modifier des membres** : l'ajout de membres est réservé au rôle ADMIN projet. La modification de rôle est réservée au rôle ADMIN projet (ou ADMIN workspace).
15. **Auto-protection des rôles** : un membre ne peut pas modifier son propre rôle (sauf ADMIN workspace). Un ADMIN projet ne peut pas modifier le rôle d'un membre dont le rôle est supérieur ou égal au sien (sauf ADMIN workspace).
16. **Un admin unique ne peut pas quitter** : un membre ADMIN projet ne peut pas quitter le projet s'il est le seul ADMIN actif. Il doit soit supprimer le projet, soit nommer un autre ADMIN avant de partir.
17. **Suppression de membre = désactivation** : retirer un membre d'un projet positionne `is_active=False` plutôt qu'une suppression physique (soft delete comportemental).
18. **ADMIN workspace bypass les restrictions projet** : un ADMIN workspace peut agir sur n'importe quel projet dont il est membre actif, indépendamment de son rôle projet (décorateur `allow_permission` niveau PROJECT).
19. **Sort order automatique** : à l'ajout d'un membre, un `ProjectUserProperty` est créé avec un `sort_order` calculé (minimum existant moins 10 000, ou 65 535 par défaut).

### États

20. **États triage séparés** : le groupe `triage` est exclu du manager par défaut (`StateManager`) et géré via un manager dédié (`TriageStateManager`). L'endpoint `StateViewSet` filtre explicitement `is_triage=False`.
21. **État par défaut protégé** : un état marqué `default=True` ne peut pas être supprimé.
22. **Suppression impossible si issues présentes** : un état ne peut être supprimé que s'il ne contient aucune issue.
23. **Séquence auto-incrémentale** : à la création d'un état, la séquence est calculée comme `max_sequence + 15000`. Par défaut la valeur est 65535.
24. **Unicité du nom par projet** : le nom d'un état doit être unique au sein d'un projet (pour les non-supprimés).
25. **Un seul état par défaut** : `mark_as_default` désactive tous les états par défaut avant d'en activer un nouveau.

### Deploy Board

26. **Un seul deploy board par projet** : `get_or_create` garantit l'unicité du deploy board par projet/workspace.
27. **Configuration exposée publiquement** : le deploy board permet d'activer/désactiver les commentaires, réactions et votes pour l'accès public.

---

## Cas d'usage (déduits)

### CU-001 — Créer un projet dans un workspace

**Acteur** : utilisateur MEMBER ou ADMIN du workspace

**Flux** :
1. L'utilisateur soumet un nom, un identifiant, et optionnellement un lead et des feature flags.
2. Le système vérifie l'unicité du nom et de l'identifiant dans le workspace.
3. Le projet est créé ; le fuseau horaire est hérité du workspace si non fourni.
4. L'utilisateur est ajouté comme ADMIN du projet. Si un `project_lead` différent est fourni, il est aussi ajouté comme ADMIN.
5. Les 6 états par défaut sont créés (Backlog, Todo, In Progress, Done, Cancelled, Triage).
6. Une activité `model_activity` est tracée en asynchrone.

**Erreur** : nom ou identifiant déjà utilisé → HTTP 400.

---

### CU-002 — Lister les projets d'un workspace

**Acteur** : tout membre actif du workspace

**Flux** :
1. Les GUEST workspace voient uniquement les projets dont ils sont membres actifs.
2. Les MEMBER workspace voient leurs projets membres ET les projets PUBLIC.
3. Les ADMIN workspace voient tous les projets.
4. Le résultat est trié par `sort_order` utilisateur puis par nom.
5. Supporte la pagination (paramètres `per_page` + `cursor`) et un filtrage de champs (`fields`).

---

### CU-003 — Consulter un projet (détail)

**Acteur** : membre actif du workspace

**Flux** :
1. Si l'utilisateur n'est pas membre du projet :
   - Projet SECRET → HTTP 403.
   - Projet PUBLIC → HTTP 409 (indique que l'utilisateur n'est pas membre mais peut rejoindre).
2. Si l'utilisateur est membre, les données complètes sont retournées.
3. La visite est tracée asynchronement (`recent_visited_task`).

---

### CU-004 — Modifier un projet

**Acteur** : ADMIN workspace ou ADMIN projet

**Contraintes** :
- Projet archivé → modification refusée (HTTP 400).
- L'activation de `intake_view` crée automatiquement un `Intake` par défaut si absent.

---

### CU-005 — Archiver / Désarchiver un projet

**Acteur** : ADMIN ou MEMBER (niveau PROJECT)

**Flux** :
- Archivage : positionne `archived_at = now()` et supprime les favoris utilisateur associés.
- Désarchivage : positionne `archived_at = None`.

---

### CU-006 — Supprimer un projet

**Acteur** : ADMIN workspace ou ADMIN projet

**Flux** :
1. Suppression physique du projet.
2. Suppression du `DeployBoard` associé.
3. Suppression des `UserFavorite` associés.
4. Déclenchement d'un webhook `project.deleted` en asynchrone.

---

### CU-007 — Gérer les membres d'un projet

**Acteur** : ADMIN projet

**Flux** :
- Ajout (bulk) : vérification du plafond de rôle workspace avant chaque ajout. Création de `ProjectMember` et `ProjectUserProperty` en bulk. Envoi d'emails de notification en asynchrone.
- Modification de rôle : vérification de la hiérarchie (ne peut pas modifier un membre de rôle >= au sien, sauf ADMIN workspace).
- Retrait : `is_active = False` (soft deactivation).

---

### CU-008 — Quitter un projet

**Acteur** : tout membre actif du projet

**Contrainte** : refusé si le membre est le seul ADMIN actif du projet.

---

### CU-009 — Gérer les états d'un projet

**Acteur** : ADMIN (création, suppression, mark as default) ; ADMIN/MEMBER/GUEST (liste, modification)

**Flux** :
- Création : réservée aux ADMINs, invalide le cache workspace des états.
- Suppression : refusée si l'état est le défaut ou s'il contient des issues.
- `mark_as_default` : désactive tous les états default du projet puis marque le nouveau.

---

### CU-010 — Configurer l'exposition publique (Deploy Board)

**Acteur** : membre du projet (ProjectMemberPermission)

**Flux** :
- `get_or_create` garantit l'unicité.
- Configuration des options : commentaires, réactions, votes, vues disponibles (list/kanban/calendar/gantt/spreadsheet), lien intake.

---

## Dépendances

- `api/workspaces` — un projet appartient à un workspace (`WorkSpace` FK) ; le rôle workspace conditionne la visibilité et les permissions projet.
- `api/auth` — authentification requise sur tous les endpoints.
- `api/issues` — les états (`State`) sont liés aux issues ; la suppression d'un état est bloquée si des issues y sont associées.
- `api/intake` — l'activation de `intake_view` crée un `Intake` par défaut.
- `space/public-board` — le `DeployBoard` alimente l'app space pour l'exposition publique.
- `api/analytics` — les projets sont le scope des analytics.
- `api/webhooks` — les événements projet (`created`, `deleted`) déclenchent des webhooks.

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :
- La logique exacte de clôture automatique basée sur `close_in` (0–12 mois) n'est pas visible dans les vues — elle est probablement dans une tâche Celery non identifiée ici.
- `ProjectDeployBoard` est marqué `# DEPRECATED TODO` dans le code (`project.py` ligne 299) : sa relation avec le nouveau modèle `DeployBoard` (deploy_board.py) mérite clarification. Est-il encore utilisé ou uniquement pour la compatibilité des anciens anchors ?
- `guest_view_all_features` : l'effet exact de ce flag (quelles features sont visibles aux guests quand activé) n'est pas documenté dans le code consulté.
- `ProjectPublicMember` : le modèle existe mais aucun endpoint ni vue ne l'utilise directement dans les fichiers consultés — son rôle fonctionnel est incertain.
- L'endpoint `list` et `list_detail` de `ProjectViewSet` semblent avoir des finalités proches (sidebar légère vs détail complet) — la distinction exacte de cas d'usage mérite confirmation.

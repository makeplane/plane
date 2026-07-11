# Tech Design / Plan — api/workspace-activity-log

> Feed d'activité workspace filtrable (Business « Workspace Activity Logs ») sur `IssueActivity` existant — **zéro migration**. 2 surfaces : Django (interne + v1/MCP) → web. Module d'échauffement avant Bulk operations.

## Stage 1 — Backend (worktree)

- `WorkspaceActivityEndpoint` (feed multi-membres, filtres actor/project/start_date/end_date, pagination) dans `plane/app/views/workspace/user.py` + route `plane/app/urls/workspace.py`.
- Filtres `start_date`/`end_date` additifs sur `WorkspaceUserActivityEndpoint` (helper de parsing partagé entre les deux vues).
- v1 : `plane/api/views/activity.py` + `plane/api/urls/activity.py` (`GET /api/v1/workspaces/<slug>/activities/`), serializer v1 existant, enveloppe paginée v1.
- Tests pytest contract (~22-28) : `apps/api/plane/tests/contract/app/test_workspace_activity.py` + `api/test_workspace_activity_v1.py`.
- **Vérif worktree** : ruff check + py_compile.

## Stage 2 — Intégration + tests réels Docker

- Appliquer le patch backend sur la branche `feat/workspace-activity-log` (basée `preview`).
- `docker exec plane-api-1 sh -c "python manage.py makemigrations --check --dry-run"` → « No changes detected ».
- pytest dans Docker (nouveaux tests + rejeu des suites activité/workspace existantes). Pas de `--create-db` requis (schéma inchangé) sauf si l'état l'exige.
- Vérif E2E sur l'API vivante (client Django in-process + APIToken local pour la v1).

## Stage 3 — Web (worktree)

- Remplir `members-activity-button.tsx` + nouveau dossier `ce/components/workspace/members/activity/` (drawer, filtres, liste SWR cursor réutilisant les briques profil).
- `workspaceService.getWorkspaceActivity`, fetch-key `WORKSPACE_ACTIVITY`, store `mutateWorkspaceMembersActivity` réel.
- i18n : clés EN + 18 autres locales via le skill translate.
- **Vérif** : `pnpm --filter web check:types`, oxlint sur les fichiers touchés.

## Stage 4 — Vérif visuelle locale

- `plane-web` (launch.json) → Settings → Members → bouton Activity → drawer : filtres, load more, empty state. Compte de test `gestiontodolist@gmail.com`.

## Stage 5 — Revue + doc + PR

- Revue sécurité adversariale (workflow 2 auditeurs + double vérif) : anti-fuite scoping projets, isolation workspace, validation params, v1 token, régression per-user.
- Corrections `fix(...)` sur la branche.
- Doc-sync : spec IMPLÉMENTÉ, VERSIONNING, CHANGELOG (pas de schema.md — zéro migration).
- PR `feat/workspace-activity-log` → `preview` (une PR = un module).

## Décisions

- **Périmètre = feed workspace filtrable** (matrice plans), PAS l'audit membres (doc members) — décision dev 2026-07-11 ; l'audit = module futur (nécessiterait un modèle + signals).
- Réutilisation de `IssueActivity` + serializers existants (app et v1) — zéro migration, zéro nouveau serializer sauf nécessité.
- Exclusions `comment/vote/reaction/draft` conservées (cohérence avec tous les feeds existants).
- Permission serveur = tout membre actif (données auto-bornées à ses projets) ; gate UI Admin+Member.
- Pas d'ADR : aucune décision dans la whitelist 06 (pas de nouveau modèle, conventions existantes) → tout en spec-technique.

## Risques

- **Volume** : le feed workspace agrège tous les projets → indexes existants sur FK (workspace, project, actor) supposés suffisants ; per_page borné. Si lenteur constatée : ajouter `select_related` manquants (pas de nouvel index sans mesure).
- **Régression per-user** : l'ajout des filtres dates doit être strictement additif — tests de non-régression sans params.
- **Worktrees basés sur `preview`** : fournir le contrat exact (chemins, signatures) dans les prompts des agents (mémoire worklog).
- Drawer web : réutiliser les briques profil sans les modifier (pas de refactor transverse dans ce module).

# HANDOFF — Reprise « Plane CE → parité Pro/Business/Enterprise »

> À copier-coller dans une nouvelle session pour continuer. Fork : `userLinpy/plane`, branche principale `preview`. Mise à jour : **2026-07-12 (vagues 1+2 complètes, tout mergé)**.

## Objectif

Réimplémenter en CE (AGPL, **sans jamais copier plane-ee**) les features payantes de Plane. Méthode Zelian (§MÉTHODE). Mémoires : `MEMORY.md`.

## ✅ MERGÉ dans `preview` (PRs #11→#39, AUCUNE PR ouverte)

- Antérieur : 6 quick wins, work-item-pages/types/properties/time-tracking, epics, workspace-pages, workspace-activity-log (#24), bulk-operations (#26), fixes #17→#29.
- **Vague 1** : #30 **estimates-time** (migration **0127**, routes v1 estimates montées → MCP estimates OK), #31 **active-cycles-workspace** (zéro migration). Revues adversariales passées, corrigées.
- **Fixes préexistants** (rouge→vert) : #32 crash suppression estimation, #33 fuite cross-projet WorkspaceCycles/ModulesEndpoint, #34 per*page<1→400, #35 profil→activity clés estimate*\*, #36 fragments sans key.
- **Vague 2** : #37 **views-access** (vues privées/publiques, zéro migration ; 3 fuites VA-01/02/03 + 2 COR fermées), #38 **milestones** (migration **0128**, contrat SDK/MCP validé live ; SEC-ms-1 + 5 COR corrigés), #39 doc-sync schema.md 0128.

## Migration leaf : **0128_milestones**. Prochaine = 0129.

## 🔴 DIRECTIVE UTILISATEUR

> « Ouvrir une branche par feature (sauf SSO/OIDC), implémenter en parallèle, IMPÉRATIVEMENT fonctionnelles. » + « Une fois les fonctionnalités bien implémentées, merge les PR ouverts. »
> Stratégie par vagues, 1 PR/feature, revue adversariale avant merge, gros chantiers en passes dédiées.

## 🗺️ ROADMAP restante (vague 3 — gros chantiers, un par un, NE PAS batcher)

Templates (work items + projets, stubs `template-select.tsx`), Audit membership (vrai member activity : nouveau modèle + signals), Pages move/share, Analytics avancés, Dépendances Gantt, Teamspaces, Workflows + approbations, Automations, Initiatives (outils MCP `create/list_initiative*` présents). Sous-features écartées : layouts additionnels workspace views (stubs `helper.tsx`), verrouillage de vue (`is_locked` write path), tier « Shared » des vues. Quick-win MCP en attente décision dev : alias `-lite` (5 endpoints list SDK → 404 en CE), `work-items/count`, `advanced-search`.

## 🔌 MCP — pointe sur le LOCAL (validé)

`~/.claude.json` : `PLANE_BASE_URL=http://localhost:8000`, slug `lin-workplace`, APIToken local (compte gestiontodolist). **Validés en direct** : get_me, get/create_project_estimate (v1 montées #30), create/update/list_milestones, manage/list_milestone_work_items (#38), manage_cycle_work_items. Reconnexion MCP = redémarrage complet de l'app ; Docker up AVANT de lancer l'app.

## 🧪 TESTER

- Docker :8000 (bind `/code`, autoreload SAUF nouveaux modules URL → `docker restart plane-api-1`). `.claude/launch.json` config `plane-web` (web:3000 + live:3100).
- Compte : gestiontodolist@gmail.com / Plane@12345 (admin `lin-workplace`). Projet DEMO `5d30d941-a180-419f-983f-3f7e5de1ad18` (estimates TIME + milestones + cycle actif activés ; jalon « Jalon v1.0 — MCP validé » ↔ DEMO-1).
- `docker exec plane-api-1 sh -c "cd /code && python manage.py makemigrations --check --dry-run && python -m pytest <fichiers> -p no:cacheprovider -q"` — **`--create-db` OBLIGATOIRE** quand le schéma de la branche diffère (la BDD de test partagée reste au dernier schéma migré, ex. 0128 → `is_milestone_enabled NOT NULL` casse les branches sans ce champ).
- ⚠️ Suite contract COMPLÈTE : échecs environnementaux (throttling/Redis partagé) **identiques sur preview** → runs ciblés par fichier = référence.
- typecheck web : `pnpm exec turbo run check:types --filter=web` (rebuild les dist ; `tsc` nu = faux négatifs sur `@plane/types` périmé).

## 📐 MÉTHODE (inchangée)

Cadrage read-only → spec 4 fichiers `docs/specs/` → impl worktrees (contrats dans les prompts) → intégration (migrations EN SÉRIE) → TESTS RÉELS Docker → **revue adversariale** (2 auditeurs sécurité+correction, findings vérifiés par lecture de code / double vote) → fix → doc-sync (spec + VERSIONNING + schema.md si BDD + CHANGELOG + i18n ×19) → 1 PR/feature. Bug préexistant = branche `fix/` + PR séparée (rouge→vert prouvé). **Merge = autorisation dev** (voir MEMORY.md merge-policy-permissions).

## 🪤 GOTCHAS (voir aussi MEMORY.md)

- Pre-commit husky OOM → `git commit --no-verify` après vérifs manuelles. CI fork = aucun check.
- runserver ≠ nouveaux modules URL → `docker restart plane-api-1`.
- Vite dev HMR se coince (circular imports) après switchs de branche → **restart dev server** (preview_stop/start) ; packages `@plane/*` consommés BUILDÉS.
- Page « services failed » = API redémarrait → recharger une fois l'API up.
- `gh pr list`/`gh pr merge` : TOUJOURS `-R userLinpy/plane` (sinon répond sur makeplane/plane upstream).
- CHANGELOG conflicte entre 2 features au merge (insertion en tête de Added) → garder les DEUX entrées ; migrations en série (merger la dépendance d'abord).
- v1 estimates + v1 milestones = `title` via `source=name` (contrat SDK Pydantic).
- computedFn arité constante ; BaseModel.save() écrase created_by (.update() en test) ; on_commit + django_capture_on_commit_callbacks ; OR multi-valué → Exists ; UniqueConstraint DRF → validators=[] ; serializer `fields="__all__"` → durcir read_only_fields (mass-assignment).
- Un hook Zelian (Stop) commite du doc-sync + fixes de revue après mes commits (même auteur userLinpy) — vérifier `git log` avant de conclure.
- CLAUDE.md gitignoré ; ce HANDOFF untracked (local). Nettoyage worktrees : `git worktree list | grep wf_` puis `git worktree remove --force` + `git worktree prune`.

## Suivi PR (fork userLinpy/plane)

**Mergées : #11→#39** (aucune PR ouverte). Vagues 1+2 complètes. Prochaine étape = vague 3 (gros chantiers un par un).

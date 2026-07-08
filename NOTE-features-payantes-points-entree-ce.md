# NOTE — Fonctionnalités payantes & points d'entrée CE (remplacement des stubs `/ce`)

> Date : 2026-07-07 · Base : Plane CE v1.3.1, branche `preview` (28ae25b5)
> Complète `NOTE-editions-licence.md`. Audit multi-agents : apps/web/ce (249 fichiers), admin/space/live, packages, backend Django, pricing public.
> Tous les chemins cités ont été vérifiés comme existants dans le repo.

---

## 1. Le mécanisme de substitution CE → EE (par app)

Il n'y a **aucun feature flag à l'exécution en CE** : la ségrégation payant/gratuit se fait entièrement **à la résolution de modules ou par absence de code**. Le dépôt fermé `makeplane/plane-ee` écrase les stubs au niveau source puis rebuild.

| Zone | Mécanisme | Fichier de config | État CE |
|------|-----------|-------------------|---------|
| `apps/web` | Alias `"@/plane-web/*" -> "./ce/*"` (EE : `./ee/*`) | `apps/web/tsconfig.json` (paths) | **249 fichiers stubs** (215 `ce/components`, 34 `ce/store`) ; ~286 imports `@/plane-web` depuis `core/` (171 fichiers) et `app/` (30 fichiers) |
| `packages/editor` | Alias `"@/plane-editor/*" -> "./src/ce/*"` | `packages/editor/tsconfig.json` | 21 stubs (`src/ce/`) ; 18 fichiers de `src/core` importent l'alias |
| `apps/live` | Alias `"@/plane-live/*" -> "./src/ce/*"` **vestigial** (dossier inexistant, jamais importé). Le seam réel = pattern core/extended : `src/services/page/extended.service.ts` (« Implementation for this is found in the enterprise repository ») | `apps/live/tsconfig.json` | `TDocumentTypes = "project_page"` fermé (`src/types/index.ts`) ; `handler.ts` jette `AppError` pour tout autre type |
| `apps/admin` | **Pas de dossier ce/**. Pattern « core/extended/index » par triplets : `providers/{core,extended,index}.tsx`, `components/common/header/{core,extended,index}`, `hooks/use-sidebar-menu/`, `hooks/oauth/` | `apps/admin/tsconfig.json` (pas d'alias EE) | `extended.*` = passthrough/maps vides ; sidebar limitée à 6 entrées |
| `apps/space` | Idem admin : un seul triplet `hooks/oauth/{core,extended,index}` | — | `extended.tsx` retourne `{ isOAuthEnabled: false, oAuthOptions: [] }` ; routes publiques limitées à index / project / issues/:anchor |
| `packages/types`, `packages/constants` | Fichiers `extended.ts` / `auth-ee.ts` avec types `never` et maps `{}`, fusionnés par spread/union dans `index.ts` | — | ex. `TExtendedLoginMediums = never`, `EXTENDED_LOGIN_MEDIUM_LABELS = {}` |
| `apps/api` (Django) | **Absence pure de code** : l'app `plane.ee` n'existe pas ici (pas dans `INSTALLED_APPS`, aucun import conditionnel). La CE conserve un **schéma dormant** en base pour permettre l'upgrade in-place | `plane/settings/common.py:97-118` | 0 occurrence de `feature_flag` ; `plane/license/` ne gère que l'Instance self-hosted (`edition` figé à `PLANE_COMMUNITY`, aucune validation de licence, aucun appel à prime.plane.so) |

Points notables :
- Aucun export conditionnel dans les `package.json`, aucune substitution dans les Dockerfiles : le swap est **100 % source-level** dans plane-ee.
- Les slugs des features EE sont **pré-réservés** côté API (`plane/utils/constants.py` : `initiatives`, `workflows`, `epics`, `silo`, `billing`, `pro`, `enterprise`…) — nos routes custom ne doivent pas entrer en collision.
- La matrice canonique des ~70 features × 5 plans est dans `apps/web/core/components/workspace/billing/comparison/plans.tsx` (+ bullet lists dans `packages/constants/src/subscription.ts`, produits/prix dans `packages/constants/src/payment.ts`, enum plans dans `packages/types/src/payment.ts`).

---

## 2. Inventaire des fonctionnalités payantes et de leurs points d'entrée

### 2.1 Stubs web complets — à remplacer dans `apps/web/ce/`

| Feature | Plan | Comportement du stub CE | Points d'entrée | Effort |
|---|---|---|---|---|
| Active Cycles workspace | Pro | Page paywall (`WorkspaceActiveCyclesUpgrade`) + badge Pro sidebar | `apps/web/ce/components/active-cycles`, `ce/components/workspace/sidebar` | moyen |
| Fin de cycle / auto-transfert | Pro | `EndCycleModal` rend `<></>` ; l'API `transfer_cycle_work_items` existe déjà | `ce/components/cycles/end-cycle`, `ce/components/cycles`, `ce/components/issues/issue-details/sidebar` | **petit** |
| Work item types + custom properties | Pro | Tous les composants rendent null, provider no-op | `ce/components/issues/{issue-modal,issue-details,filters,issue-layouts}` | gros |
| Epics | Pro | Modal `<></>`, stores dummy (« This class will never be used ») | `ce/components/epics`, `ce/store/issue/epic` | gros |
| Teamspaces | Pro | Sidebar Teams null, stores dummy, colonnes groupement désactivées | `ce/components/workspace/sidebar`, `ce/components/projects/teamspaces`, `ce/store/issue/{team,team-project,team-views}` | gros |
| Workflows + approbations | Business | Hook retourne « tout autorisé », overlays `<></>` | `ce/components/workflow` | gros |
| Time tracking / worklogs | Pro | Toute l'UI worklog rend `<></>` | `ce/components/issues/worklog` | moyen (UI) + gros (modèle API absent) |
| Estimations avancées (TIME, édition/suppression points) | Pro | `isEstimateSystemEnabled` → false pour TIME ; modals édition/suppression `<></>` | `ce/components/estimates`, `ce/store/estimates` | petit-moyen |
| Bulk operations | Pro | Sélection multiple OK mais barre d'action = bannière upgrade | `ce/components/issues/bulk-operations` | moyen |
| Dépendances Gantt/timeline | Pro | `isDependencyEnabled = false`, composants de tracé `<></>` | `ce/components/gantt-chart/{dependency,layers}`, `ce/store/timeline` | gros |
| Dédoublonnage IA (de-dupe) | Pro/Business | Tous `<></>` (nécessite backend IA) | `ce/components/de-dupe` | gros |
| Duplication de work item | Pro | Menu « Copy » simple, modal `<></>` | `ce/components/issues/issue-layouts/quick-action-dropdowns` | **petit** |
| Templates (work items + projets) | Pro / Business | Sélecteurs `<></>`, contexte no-op | `ce/components/issues/issue-modal`, `ce/components/projects/create` | moyen-gros |
| Pages avancées (move/share/collaborateurs) | Pro/Business | Boutons et modals null ; `ExtendedBasePage.asJSONExtended = {}` | `ce/components/pages`, `ce/store/pages` | gros |
| Embed d'issues dans les pages | Pro | Carte « upgrade to Plane Pro » à la place de l'embed | `ce/components/pages/editor/embed` | moyen |
| Éditeur IA « Ask Pi » | Pro+ | Fonctionnel mais réduit (1 tâche, ancienne intégration OpenAI dépréciée) | `ce/components/pages/editor/ai` | petit (enrichir) / gros (équivalent Pi) |
| Publication de vues | Pro | Hook constantes désactivées, modal `<></>` | `ce/components/views/publish` | moyen |
| Contrôle d'accès des vues + layouts workspace | Pro | `AccessController` `<></>`, layouts additionnels absents | `ce/components/views` | petit-moyen |
| Analytics avancés / rapports | Pro/Business | 2 onglets seulement (`overview`, `work-items`) | `ce/components/analytics`, `ce/store/analytics.store.ts` | gros |
| Automations custom | Pro→Ent. | `CustomAutomationsRoot` `<></>` (seuls auto-archive/close CE existent) | `ce/components/automations` | gros |
| Intake email/formulaires (UI) | Business | `InboxSourcePill` `<></>`, pas de réglages email/form | `ce/components/inbox`, `ce/components/projects/settings/intake` | moyen |
| Journal d'activité des membres | Business | Bouton `<></>`, mutation store no-op | `ce/components/workspace/members`, `ce/store/workspace` | petit-moyen |
| App rail / app switcher (Wiki, Pi…) | Pro+ | Un seul dock item « Projects », switchers null | `ce/components/app-rail`, `ce/components/sidebar` | moyen (infra) |
| Infra licence/billing/paywall | — | Badge « Community », modals d'upgrade → plane.so | `ce/components/license`, `ce/components/workspace/billing`, `ce/components/common/subscription` | petit (neutraliser les CTA) |
| Points d'extension génériques (Power-K, mentions, notifications, rich filters, relations custom, widgets issue-detail, home, desktop) | — | Types `never`, maps `{}`, hooks null/[] | `ce/components/command-palette`, `ce/components/{editor,workspace-notifications,rich-filters,relations,home,desktop}`, `ce/components/issues/issue-detail-widgets`, `ce/store/issue/helpers` | petit par point |

Flags codés en dur côté `core` (hors ce/, à modifier aussi) : `apps/web/core/hooks/use-page-flag.ts` (`isMovePageEnabled`/`isPageSharingEnabled` = false), `apps/web/core/hooks/use-editor-flagging.ts` (extensions `ai` et `collaboration-cursor` désactivées pour les 3 éditeurs).

### 2.2 Seams hors web

| Feature | Plan | Points d'entrée | État |
|---|---|---|---|
| SSO SAML/OIDC | Pro | `packages/types/src/instance/auth-ee.ts` (`never`), `packages/constants/src/auth/extended.ts` (`{}`), `apps/admin/hooks/oauth/`, `apps/space/hooks/oauth/extended.tsx` | Seam front prêt ; backend provider Django à écrire (`plane/authentication/provider/`) |
| LDAP / SCIM / group sync | Enterprise | Aucun scaffold (juste i18n `group_syncing` dans `packages/i18n/src/locales/en/workspace-settings.json`) | Greenfield total |
| Activation licence admin | — | `packages/types/src/instance/base.ts` (`license_key` transite, aucune UI), `apps/admin/hooks/use-sidebar-menu/` | Seam sidebar/header prêt |
| Pages workspace/wiki temps réel | Pro/Business | `apps/live/src/services/page/` (PageService abstrait), `apps/live/src/types/index.ts` (élargir `TDocumentTypes`), `packages/types/src/page/extended.ts` | Patron `project-page.service.ts` à dupliquer |
| Extensions éditeur (issue-embed, IA, blocs) | Pro+ | `packages/editor/src/ce/` (registres vides, `flaggedExtensions` transporté partout) | Chaque extension = nœud Tiptap + schéma Y.js partagé avec live |
| Opérateurs rich filters étendus/négatifs | Pro/Business | `packages/types/src/rich-filters/*/extended.ts`, `packages/constants/src/rich-filters/operator-labels/` | 5 fichiers `extended` à remplir + support API |
| Publication publique étendue (pages/vues/intake forms sur space) | Pro/Business | `apps/space/app/routes.ts` (3 routes CE seulement), `apps/space/types/intake.d.ts` | Nouvelles routes SSR + endpoints publish |

### 2.3 Backend Django — schéma dormant (le plus intéressant)

| Feature | Ce qui existe déjà en base | Ce qui manque | Points d'entrée |
|---|---|---|---|
| **Nested pages / wiki** | `Page.parent` self-FK, `PageVersion.sub_pages_data` (JSONField), SQL récursif archive/unarchive | Le list filtre `parent__isnull=True` (`plane/app/views/page/base.py:97,429`) ; `sub_pages` figé à `{}` (`plane/bgtasks/page_version_task.py:29,47,69`) ; pas d'endpoint sub-pages | `plane/db/models/page.py`, `plane/app/views/page/base.py`, `plane/bgtasks/page_version_task.py` |
| **Issue types / epics** | Tables `issue_types` + `project_issue_types` (`plane/db/models/issue_type.py`), FK `Issue.type`, toggle `Project.is_issue_type_enabled` | Aucun CRUD (0 vue/serializer/URL), aucun `IssueType.objects.create` en CE ; l'archive **exclut** les epics (`plane/app/views/issue/archive.py:99`) | `plane/db/models/issue_type.py`, `plane/api/serializers/issue.py:159-166` |
| **Intake email/forms** | Colonnes `IntakeIssue.source` + `source_email` | Enum `SourceType` ne contient que `IN_APP` ; toutes les créations codent `IN_APP` en dur | `plane/db/models/intake.py:38-39,70-71`, `plane/app/views/intake/base.py:277` |
| **Time tracking** | Toggle `Project.is_time_tracking_enabled` (colonne réelle, modifiable) | **Aucun** modèle WorkLog, aucun endpoint — toggle purement décoratif | `plane/db/models/project.py:98` |
| Importers legacy | Modèle `Importer` dormant (`plane/db/models/importer.py`) + services front Jira legacy | Silo (fermé) l'a remplacé | `apps/web/core/services/integrations/` |
| Intégrations legacy | Modèles `plane/db/models/integration/` (github.py, slack.py) + composants `apps/web/core/components/integration/` | Idem — hooks legacy pré-Silo | `apps/web/core/services/app_installation.service.ts` |
| Initiatives / Teamspaces / Customers / Recurring / Templates / Workflows | **Rien** — aucune table (`plane/db/models/__init__.py` fait foi) ; slugs réservés seulement | Greenfield complet : modèles + migrations + vues + URLs | `plane/utils/constants.py` (éviter les slugs réservés) |

Autres accroches front actives repérées : `milestones` déjà déclaré dans `ProjectOverviewCollapsible` (`apps/web/core/store/project/project.store.ts:21,86`) + clés i18n milestone livrées ; `initiativesSidebarCollapsed` dans `apps/web/core/store/theme.store.ts` ; champ d'activité `is_project_updates_enabled` géré par `apps/web/core/components/common/activity/helper.tsx:69,268`.

### 2.4 Non réimplémentable en remplaçant du code local (dépendances cloud Plane)

- **Importers & intégrations Silo** (Jira/Linear/Asana/ClickUp/Notion/Confluence, GitHub/GitLab/Slack/Sentry) : service fermé, opéré par Plane (ou self-hosté en Commercial avec flags prime.plane.so). Alternative : réécrire nos propres importers sur l'API REST CE.
- **Plane AI / Pi** (chat, AI search, crédits) : service mesuré par Plane ; en self-hosted Commercial = BYO-key OpenAI/Anthropic + OpenSearch. Alternative CE : brancher notre propre clé sur `aiService.performEditorTask` (déjà fonctionnel si l'instance a une clé OpenAI).
- **App mobile + push notifications** : binaire distribué par Plane, refuse la CE ; push servi par l'infra cloud Plane.
- **Serveur de licence Prime** : sans objet pour nous (notre CE n'a aucun entitlement à déverrouiller).

---

## 3. Méthode recommandée pour « remplacer les /ce »

1. **Front web** : coder **directement dans `apps/web/ce/`** — c'est le dossier que le build CE résout déjà, zéro config à changer. Variante plus propre pour suivre l'upstream : dupliquer `ce/` en `custom/` et pointer l'alias `"@/plane-web/*"` vers `./custom/*` dans `apps/web/tsconfig.json` (1 ligne), pour garder des rebases upstream sans conflits sur les stubs.
2. **Backend** : créer une app Django dédiée (ex. `plane.custom`) ajoutée à `INSTALLED_APPS` + montée dans `plane/urls.py`, qui exploite le schéma dormant (IssueType, Page.parent, intake.source…) plutôt que de modifier les vues CE en place — même logique de superposition que plane.ee. Respecter `01-database.md` (migrations versionnées) et éviter les slugs réservés.
3. **Éditeur / live** : les features pages (nested, wiki, embeds) impliquent le trio `packages/editor/src/ce` + `apps/live/src/services/page` + API — à traiter comme un module unique (spec `docs/specs/live/realtime-collaboration/` + RETRO-071 à relire avant).

### Quick wins (ratio valeur/effort)

1. **Fin de cycle + auto-transfert** — l'endpoint API existe (`transfer_cycle_work_items`), il ne manque que la modal.
2. **Duplication de work item** — clonage + modal de destination.
3. **Édition/suppression de points d'estimation** (+ système TIME si utile).
4. **Nested pages** — champ `parent` accepté en écriture, cascade archive déjà en SQL récursif ; il manque : dé-filtrer le list, un endpoint sub-pages, remplir `sub_pages_data`, l'UI d'arbre (cf. investigation précédente).
5. **Publication de vues** — réutiliser le pipeline anchor/publish de space.
6. **Intake email** — ajouter `EMAIL` à `SourceType` + webhook entrant ; la colonne `source_email` attend.

Gros chantiers (à specifier avant) : issue types/custom properties, workflows+approbations, teamspaces, automations, dashboards, time tracking (modèle complet).

---

## 4. Cadre légal (rappel)

- La CE est **AGPL-3.0** : réimplémenter soi-même des fonctionnalités équivalentes est licite. **Ne jamais copier de code du repo `plane-ee`** (propriétaire) ni décompiler les builds Commercial.
- AGPL : si l'instance modifiée est offerte en service réseau à des tiers, les sources modifiées doivent être rendues disponibles.
- Ne pas utiliser la marque « Plane Pro/Business » pour désigner nos ajouts.

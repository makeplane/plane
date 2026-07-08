# Tech Design / Plan d'implémentation — api/work-item-pages

> Plan à valider avant `/superpowers:execute-plan`. V1 = Socle Plane-parity (décision dev 2026-07-08).

## Principe

Relation de première classe `IssuePage` (table pure, intra-workspace, sans permission), exposée sur l'API interne (UI web) **et** externe token-auth (MCP). Auth résolue par ligne au read ; attach/detach journalisés en activité. Préparé GAC/audit/isolation Enterprise sans dette.

## Stages (chacun vérifiable indépendamment)

### Stage 1 — Modèle + migration (API)
- `IssuePage` dans `plane/db/models/page.py`, export dans `db/models/__init__.py`.
- Migration `0123_issue_pages` écrite à la main (imiter `0122`).
- **Vérif** : `python -m py_compile`, relecture ; `makemigrations --check` (quand env dispo) doit être no-op.

### Stage 2 — Service partagé + serializer (API)
- `IssuePageSerializer` (page allégée) + un helper d'accès `can_read_page(user, page)` réutilisant le pattern `Q(owned_by=user) | Q(access=PUBLIC)` déjà présent dans `page/base.py`.
- Fonction commune `attach/detach/list` partagée entre vues interne et externe.
- **Vérif** : ruff + py_compile.

### Stage 3 — Endpoints internes (app) + activité
- Vue `IssuePageEndpoint` (GET/POST/DELETE) dans `plane/app/views/issue/` + routes dans `app/urls/issue.py`.
- Émission `issue_activity` sur attach/detach.
- Tests pytest contract (`tests/contract/app/test_issue_pages_app.py`).
- **Vérif** : ruff, py_compile, tests écrits (exécution quand BDD dispo).

### Stage 4 — Endpoints externes (api v1, MCP)
- Vue + routes dans `plane/api/views/` et `plane/api/urls/` (nouveau module page-link — l'API externe n'a aucun endpoint page aujourd'hui).
- Mêmes contrôles d'accès, auth par API key.
- Tests pytest.
- **Vérif** : ruff, py_compile, tests.

### Stage 5 — Web : store + services
- `issue.service.ts` : `fetchIssuePages` / `attachPage` / `detachPage`.
- `useIssueDetail` (link store analogue) : state `pages` + actions.
- **Vérif** : `pnpm --filter web check:types`, oxlint/oxfmt.

### Stage 6 — Web : UI (section « Pages » + modale)
- `issue-detail-widgets/pages/` (root + collapsible + liste) branché à côté de Links/Attachments (repérer l'`optionsOrder`/le call site comme pour pages-nested).
- Modale Link/Create (recherche projet + create).
- **Vérif** : typecheck web, lint, format.

### Stage 7 — Intégration + revue
- Typecheck web complet, ruff API complet.
- Revue adversariale ciblée sécurité (fuite via list, transitivité d'accès, cross-workspace).
- Doc sync Zelian (spec-technique → IMPLÉMENTÉ, VERSIONNING, CHANGELOG) + décision ADR (probablement aucun : DATA-MODEL mineur confiné → spec-technique ; à repasser par la politique 06).

## Points ouverts à trancher au fil de l'eau
- Réutilisation exacte du pipeline `issue_activity` (nom du field/verb).
- Nom d'URL externe (`.../pages/` vs `.../issue-pages/`) — aligner sur ce qu'attend le MCP (à confirmer en appelant `list_work_item_pages` une fois un endpoint dispo, ou via la doc du serveur MCP).
- Le `work-item-page-embed` existant : laissé tel quel en V1 (réconciliation Phase 2).

## Risques
- Surface API externe nouvelle → revue sécurité obligatoire (auth par ligne, isolation workspace).
- Pas d'exécution pytest locale (pas d'env BDD) → tests écrits, à faire tourner en CI/env.

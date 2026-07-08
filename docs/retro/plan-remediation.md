# Plan de Remédiation — Plane v1.3.1

> Date : 2026-06-30 — Source : audit-initial.md + dette-technique.md
> Référence dette : C = CRITIQUE, M = MAJEUR, m = MINEUR

---

## Stratégie

La priorité absolue est d'établir un filet de sécurité via les tests avant toute intervention fonctionnelle : sans couverture, chaque correction ou feature risque d'introduire des régressions silencieuses. En Phase 2, les risques sécurité résiduels et les features incomplètes critiques (ProjectWebhook, migration Next.js) sont stabilisés. La Phase 3 adresse la dette structurelle et le nettoyage progressif, en profitant des fenêtres ouvertes par les refactorings de Phase 2.

---

## Phase 1 — Corrections critiques (Sprint 1-2)

Objectif : mettre en place les tests manquants sur les surfaces à plus fort risque et documenter les features non couvertes par la rétro.

| # | Action | Feature | Effort estimé | Prérequis | Référence dette |
|---|--------|---------|--------------|-----------|-----------------|
| 1.1 | Écrire les tests pytest pour les endpoints critiques sans couverture : POST/PATCH/DELETE issues, cycles, modules (CRUD de base + permissions RBAC) | api/issues, api/cycles, api/modules | L | — | C-2 |
| 1.2 | Écrire les tests pytest pour le pipeline webhooks : création, dispatch, signature HMAC, retry, désactivation | api/webhooks | M | — | C-2 |
| 1.3 | Écrire les tests pytest pour les endpoints pages (CRUD, archivage cascade, versioning) et intake (soumission publique, triage) | api/pages, api/intake | L | — | C-2 |
| 1.4 | Écrire les tests pytest pour le module analytics : couche legacy (build_graph_plot) + couche avancée (build_analytics_chart) | api/analytics | M | — | C-2 |
| 1.5 | Écrire les tests pytest pour le pipeline notification complet : génération in-app + buffer EmailNotificationLog + envoi SMTP | api/notifications | M | — | C-3 |
| 1.6 | Documenter les 7 features manquantes (draft-issues, exports, estimates, ai, admin/instance, space/public-board, favorites-stickies) via retro-documenter — en priorité admin/instance et space/public-board | Multiple | L | — | M-11 |
| 1.7 | Ajouter des tests Vitest sur les composants front critiques : formulaire de création d'issue, stores MobX issues/projects, auth flow | apps/web | M | — | C-1 |

---

## Phase 2 — Stabilisation sécurité et features incomplètes (Sprints 3-4)

Objectif : clore les risques sécurité résiduels, finaliser les features partielles, et amorcer la migration Next.js.

| # | Action | Feature | Effort estimé | Prérequis | Référence dette |
|---|--------|---------|--------------|-----------|-----------------|
| 2.1 | Ajouter la validation structurelle du JSON ProseMirror (`description_json`) sur la voie publique intake — schema Tiptap/ProseMirror | api/intake, space/public-board | M | 1.3 (tests en place) | M-5 |
| 2.2 | Étendre la sanitisation nh3 à la voie interne authentifiée (`IntakeIssueViewSet.create`) pour réduire l'asymétrie | api/intake | S | 1.3 | M-6 |
| 2.3 | Ajouter des tests unitaires SSRF sur `url_security.py` / `ip_address.py` : DNS rebinding simulé, `169.254.169.254`, redirection vers IP interne, IPv6 mappé | api/webhooks | M | 1.2 | m-18, M-12 |
| 2.4 | Documenter la raison du CSRF désactivé dans `BaseSessionAuthentication` — si le choix est délibéré, le justifier dans la spec-technique auth ; sinon, activer CSRF avec exemption ciblée | api/auth | S | — | M-4 |
| 2.5 | Câbler `ProjectWebhook` dans le dispatch et les vues REST, ou le retirer du code si la feature est abandonnée | api/webhooks | M | 1.2 | M-2 |
| 2.6 | Définir et documenter le schéma JSON du `progress_snapshot` des cycles (Pydantic ou TypedDict) — ajouter une validation à l'écriture dans `transfer_cycle_issues` | api/cycles | S | 1.1 | M-3, M-10 |
| 2.7 | Trancher et mettre à jour le statut de RETRO-041 (ADR vs spec-technique) lors de la revue DRAFT avec les devs | api/cycles | XS | M-10 réalisé | M-10 |
| 2.8 | Déclarer la contrainte `requests >= 2.32` dans `requirements/base.txt` et ajouter un test qui vérifie la présence de `get_connection_with_tls_context` lors de l'import | api/webhooks | XS | — | M-12 |
| 2.9 | Implémenter l'auth HMAC sur les endpoints admin de `apps/live` (supprimer le TODO dans `auth-middleware.ts`) | live/realtime-collaboration | M | — | M-13 |
| 2.10 | Auditer et supprimer les shims `compat/next/` dans apps/web et apps/admin — migrer les consommateurs vers les imports React Router v7 natifs | apps/web, apps/admin | L | — | M-1 |
| 2.11 | Ajouter une vérification CI que toutes les actions ViewSet exposent un décorateur `@allow_permission` (lint rule ou test de reflexion) | api/\* | M | 1.1, 1.2, 1.3 terminés | RETRO-021 (dette) |

---

## Phase 3 — Amélioration continue (Sprints 5+)

Objectif : nettoyage structurel, réduction de la complexité, amélioration de la testabilité front.

| # | Action | Feature | Effort estimé | Prérequis | Référence dette |
|---|--------|---------|--------------|-----------|-----------------|
| 3.1 | Supprimer ou activer le champ AI deprecated — retirer de l'interface admin et des configs si la feature est abandonnée | api/ai, admin/instance | S | 1.6 (admin/instance documenté) | m-1 |
| 3.2 | Refactoriser le champ `sender` des notifications en enum ou en champ structuré — remplacer le filtrage `icontains="mentioned"` | api/notifications | M | 1.5 | m-2 |
| 3.3 | Ajouter `@allow_permission` explicite sur `WorkspaceViewViewSet.retrieve` et documenter le comportement | api/views | XS | — | m-3 |
| 3.4 | Factoriser la logique de résolution d'URL d'avatar en un helper partagé (`analytics_utils.py`) | api/analytics | S | 1.4 | m-5 |
| 3.5 | Documenter et planifier la dépréciation de la couche analytics legacy — établir un plan de migration vers la couche avancée | api/analytics | M | 1.4 | m-4 |
| 3.6 | Supprimer `IssueBlocker` (table legacy remplacée par `IssueRelation`) après vérification qu'aucun code actif ne la référence | api/issues | S | — | m-19 |
| 3.7 | Supprimer ou implémenter les champs `moved_to_page` et `moved_to_project` sur `Page` | api/pages | XS | 1.6 (pages documentées) | m-14 |
| 3.8 | Documenter `skip_activity` dans l'API publique ou le déplacer dans un endpoint interne non exposé | api/intake | XS | — | m-15 |
| 3.9 | Traiter les URL legacy `/inboxes/` / `/inbox-issues/` — ajouter des headers de dépréciation (Warning) ou les supprimer | api/intake | XS | — | m-17 |
| 3.10 | Centraliser les constantes RBAC (20/15/5) dans un module unique importé par tous les consommateurs | api/\* | S | — | m-10 |
| 3.11 | Résoudre la contrainte hard delete sur les cycles — aligner sur le pattern soft delete du reste du modèle (décision à documenter en spec-technique) | api/cycles | M | 1.1 | m-9 |
| 3.12 | Ajouter tests Playwright E2E sur les parcours critiques : création de compte, création d'issue, soumission intake publique | apps/web, apps/space | L | 1.7, 2.10 terminés | C-1 |
| 3.13 | Résoudre le backlog de 11 957 warnings oxlint dans apps/web — établir une cible progressive (ex: --max-warnings=8000 puis 5000) | apps/web | L | — | m-20 |

---

## Dépendances entre actions

```
Phase 1 (filet de test) doit être complétée AVANT Phase 2 (sécurité / refactoring) :
  1.1 → 2.6, 2.7, 2.11
  1.2 → 2.3, 2.5, 2.8
  1.3 → 2.1, 2.2
  1.4 → 3.4, 3.5
  1.5 → 3.2
  1.6 (admin/instance) → 3.1
  1.7 → 3.12

Phase 2 doit être complétée AVANT certaines actions Phase 3 :
  2.10 (suppression shims) → 3.12 (tests E2E — environnement stable requis)
  2.11 (lint rule permissions) → doit rester en vigueur après 2.5

Actions indépendantes (peuvent être faites à tout moment) :
  2.4 (documenter CSRF) — documentation seule, pas de code
  2.7 (trancher RETRO-041) — décision humaine, pas de code
  2.8 (déclarer contrainte requests) — modification requirements.txt
  3.3 (allow_permission sur retrieve) — modification de 2 lignes
  3.6 (supprimer IssueBlocker) — après vérification grep
  3.7 (champs moved_to_*) — modification modèle + migration
  3.8 (documenter skip_activity) — documentation seule
  3.9 (déprécier inboxes URLs) — modification de routing
  m-11 (WorkspaceViewViewSet.retrieve) — XS, faisable en opportunité
```

---

## Récapitulatif par sprint

| Sprint | Actions | Thème |
|--------|---------|-------|
| 1-2 | 1.1 à 1.7 | Mise en place du filet de tests + documentation features manquantes |
| 3-4 | 2.1 à 2.11 | Sécurité résiduelle + features incomplètes + migration Next.js |
| 5+ | 3.1 à 3.13 | Nettoyage structurel + amélioration continue |

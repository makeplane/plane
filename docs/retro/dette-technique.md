# Dette Technique — Plane v1.3.1

> Classement par criticité : CRITIQUE > MAJEUR > MINEUR
> Date : 2026-06-30 — Source : Rétro-ingénierie (13 features documentées sur 20)

---

## CRITIQUE — À corriger immédiatement

| # | Description | Feature | Fichier(s) | Impact |
|---|------------|---------|-----------|--------|
| C-1 | Aucun test automatisé sur les 3 apps front (web, admin, space) — zéro fichier Vitest ou Playwright identifié | web/\*, admin/\*, space/\* | `apps/web/`, `apps/admin/`, `apps/space/` | Toute modification front est aveugle : régressions UI non détectées en CI, impossibilité de refactorer avec confiance |
| C-2 | Aucun test sur les features API : cycles, modules, pages, intake, analytics, webhooks, views | api/cycles, api/modules, api/pages, api/intake, api/analytics, api/webhooks, api/views | `apps/api/plane/tests/` (absent pour ces modules) | 7 features critiques modifiables sans filet — chaque évolution est un risque de régression en production |
| C-3 | Couverture test notifications très partielle : seule la tâche cleanup est testée, pas la génération ni l'envoi email | api/notifications | `apps/api/plane/bgtasks/notification_task.py`, `email_notification_task.py` | Pipeline de notification email (trigger → buffer → envoi SMTP) non testé — pannes silencieuses possibles |

---

## MAJEUR — À planifier dans les 2 prochains sprints

| # | Description | Feature | Fichier(s) | Impact |
|---|------------|---------|-----------|--------|
| M-1 | Migration Next.js → React Router v7 inachevée — shims `compat/next/` (Link, Image, Script, types next/link, next/navigation) actifs dans web et admin | apps/web, apps/admin | `apps/web/app/compat/next/`, `apps/admin/app/compat/next/` | Code mort, comportements non standard à la prochaine mise à jour React Router, complexité de maintenance accrue |
| M-2 | `ProjectWebhook` modèle existant non câblé dans le dispatch ni dans les vues REST | api/webhooks | `apps/api/plane/db/models/webhook.py` (table `project_webhooks`), `apps/api/plane/bgtasks/webhook_task.py` | Feature annoncée non opérationnelle — risque de confusion lors d'une tentative d'activation |
| M-3 | Format JSONB `progress_snapshot` des cycles sans schéma de validation — structure non documentée et non contrôlée | api/cycles | `apps/api/plane/db/models/cycle.py` (champ `progress_snapshot`), `apps/api/plane/utils/cycle_transfer_issues.py` | Changements de structure entre versions créent des incompatibilités silencieuses ; cycle source illisible après transfert si le format diverge |
| M-4 | CSRF désactivé dans `BaseSessionAuthentication` sans documentation de la raison ni compensations explicites | api/auth | `apps/api/plane/authentication/session.py` | Potentielle surface CSRF sur les endpoints DRF exposés à des navigateurs — la raison de la désactivation (client React séparé ?) n'est pas documentée |
| M-5 | `description_json` (AST ProseMirror) non validé structurellement sur la voie publique intake — seul `description_html` est sanitisé via nh3 | api/intake, space/public-board | `apps/api/plane/utils/content_validator.py`, `apps/api/plane/space/views/intake.py` | Vecteur XSS potentiel si le rendu Tiptap interprète des nœuds ProseMirror malveillants issus d'une soumission publique |
| M-6 | Asymétrie sanitisation HTML : voie publique (intake) sanitisée via nh3, voie interne authentifiée (IntakeIssueViewSet) non sanitisée | api/intake | `apps/api/plane/app/views/intake/base.py` vs `apps/api/plane/space/views/intake.py` | Si un compte membre est compromis, la voie interne devient un vecteur XSS stocké non protégé |
| M-7 | Allowlist nh3 maintenue manuellement — non synchronisée avec les composants Tiptap (`packages/@plane/editor`) | api/intake, space/public-board | `apps/api/plane/utils/content_validator.py` | Chaque nouveau tag/attribut Tiptap doit être répercuté manuellement ; oubli = XSS stocké |
| M-8 | Non-chevauchement des cycles vérifié uniquement via endpoint `/date-check/`, pas par contrainte BDD — race condition théoriquement possible | api/cycles | `apps/api/plane/app/views/cycle/base.py` | Deux cycles peuvent se chevaucher si créés simultanément — invariant non garanti côté base |
| M-9 | Sort order des cycles et modules peut devenir négatif à l'infini (soustraction de 10 000 à chaque création) sans normalisation périodique | api/cycles, api/modules | `apps/api/plane/db/models/cycle.py`, `module.py` | Valeur de `sort_order` illisible et potentiellement problématique pour les affichages à très long terme |
| M-10 | ADR RETRO-041 (progress_snapshot cycles) : critère Q3 non confirmé — impact transverse à valider lors de la revue DRAFT | api/cycles | `docs/adr/RETRO-041-cycle-progress-snapshot.md` | Le statut ADR vs spec-technique n'est pas tranché — risque de décision architecturale non tracée |
| M-11 | 7 features non documentées dans cette passe : draft-issues, exports, estimates, ai, admin/instance, space/public-board, favorites-stickies | Multiple | — | Périmètre flou — impossible de raisonner sur les dépendances ou de modifier en sécurité ces features sans doc |
| M-12 | Dépendance sur `requests >= 2.32` (méthode `get_connection_with_tls_context`) non déclarée explicitement pour le DNS-pinning des webhooks | api/webhooks | `apps/api/plane/utils/url_security.py` (classe `PinnedIPAdapter`) | Mise à jour de la lib `requests` peut casser silencieusement la protection anti-SSRF sans avertissement |
| M-13 | TODO HMAC en commentaire dans `auth-middleware.ts` — authentification des endpoints admin du serveur live par clé statique partagée | live/realtime-collaboration | `apps/live/src/lib/auth-middleware.ts` | Clé statique moins robuste qu'un HMAC signé pour les appels admin inter-services |

---

## MINEUR — À traiter en opportunité

| # | Description | Feature | Fichier(s) | Impact |
|---|------------|---------|-----------|--------|
| m-1 | Champ AI marqué deprecated mais toujours présent dans le code, les migrations et l'interface admin | api/ai, admin/instance | `apps/admin/app/(all)/(dashboard)/ai/`, `apps/api/plane/app/views/external/base.py` | Code mort confus, surface d'attaque non nécessaire si un credential OpenAI est configuré par erreur |
| m-2 | `sender` notifications encodé en chaîne libre — filtrage par `icontains="mentioned"` fragile | api/notifications | `apps/api/plane/db/models/notification.py`, `apps/api/plane/app/views/notification/base.py` | Renommage d'une catégorie de sender casse le filtrage mention sans erreur visible |
| m-3 | `WorkspaceViewViewSet.retrieve` sans `@allow_permission` explicite — protection par filtre queryset uniquement | api/views | `apps/api/plane/app/views/view/base.py` | Potentielle zone grise d'accès par UUID pour des utilisateurs non membres du workspace |
| m-4 | Double couche analytics legacy/avancée coexistant sans stratégie de migration ni plan de dépréciation | api/analytics | `apps/api/plane/app/views/analytic/base.py`, `advance.py`, `project_analytics.py` | Complexité de maintenance, conventions incohérentes (snake_case vs SCREAMING_SNAKE_CASE), export CSV couplé à la couche legacy |
| m-5 | Logique de résolution d'URL d'avatar dupliquée dans 4 fichiers analytics sans factorisation | api/analytics | `base.py`, `advance.py`, `project_analytics.py`, `analytic_plot_export.py` | Maintenabilité réduite — tout changement de logique avatar doit être répercuté 4 fois |
| m-6 | Filtre intake dans `AdvanceAnalyticsEndpoint` avec TODO et valeurs numériques non documentées (`"-2", "-1", "0", "1", "2"`) | api/analytics | `apps/api/plane/app/views/analytic/advance.py` | Sémantique des statuts intake opaque — risque de régression lors d'un refactoring du module intake |
| m-7 | `UserNotificationPreference` possède des FK workspace/project nullable non exploitées dans les vues | api/notifications | `apps/api/plane/db/models/notification.py` | Infrastructure prévue pour un futur scoping non implémenté — colonnes orphelines confusantes |
| m-8 | URL de base de l'app pour les emails de notification lue depuis Redis par `issue_id` sans gestion explicite de l'origine ni documentation | api/notifications | `apps/api/plane/bgtasks/email_notification_task.py` | Si la clé Redis est absente, l'email est silencieusement abandonné sans log ni alerte |
| m-9 | Hard delete des cycles (contrairement aux issues qui ont un soft delete) — TODO dans le code sur la tension avec CycleIssue | api/cycles | `apps/api/plane/app/views/cycle/base.py` | Perte irréversible des CycleIssue lors de la suppression d'un cycle — asymétrie par rapport au reste du modèle |
| m-10 | Valeurs numériques RBAC (20/15/5) potentiellement dupliquées dans plusieurs fichiers sans source unique | api/workspaces, api/projects | `apps/api/plane/app/permissions/base.py`, `project.py` | Modification du modèle RBAC nécessite plusieurs points de mise à jour |
| m-11 | `champ access` (Public/Private) de IssueView non modifiable post-création (read_only_fields) sans documentation de cette limitation | api/views | `apps/api/plane/app/serializers/view.py` | Limitation fonctionnelle non documentée — peut surprendre les intégrateurs API |
| m-12 | Migration de `GlobalView` vers `IssueView` (project=NULL) et de `IssueViewFavorite` vers `UserFavorite` — histoire des migrations non documentée | api/views | `apps/api/plane/db/migrations/` | Incompréhension possible du modèle actuel pour un dev ne connaissant pas l'historique des refactorings |
| m-13 | `champ is_global` sur `Page` avec usage non déterminé | api/pages | `apps/api/plane/db/models/page.py` | Champ opaque — comportement réel inconnu, risque de mauvaise utilisation |
| m-14 | Champs `moved_to_page` et `moved_to_project` sur `Page` non implémentés (présents en BDD, sans vue ni logique) | api/pages | `apps/api/plane/db/models/page.py` | Colonnes orphelines confusantes — feature incomplète |
| m-15 | `skip_activity` flag dans `IntakeIssueViewSet.partial_update` non documenté dans l'API publique | api/intake | `apps/api/plane/app/views/intake/base.py` | Usage interne non documenté exposé via l'API — risque de mauvaise utilisation par des intégrateurs |
| m-16 | Champ `extra` JSONField sur `IntakeIssue` jamais utilisé dans les sérialiseurs exposés | api/intake | `apps/api/plane/db/models/intake.py` | Colonne orpheline en attente d'un usage futur non documenté |
| m-17 | Double alias d'URL intake/inbox (`/intakes/` et `/inboxes/`) non documenté comme rétrocompatibilité | api/intake | `apps/api/plane/app/urls/intake.py` | URL legacy maintenue sans politique de dépréciation |
| m-18 | Aucun test automatisé couvrant les vecteurs SSRF sur les webhooks (DNS rebinding, redirections, IPv6 mappé) | api/webhooks | `apps/api/plane/utils/url_security.py`, `ip_address.py` | Protection anti-SSRF correcte dans le code mais non régression-testée |
| m-19 | `IssueBlocker` (legacy) table maintenue en parallèle de `IssueRelation` — non utilisée par les vues actuelles | api/issues | `apps/api/plane/db/models/issue.py` | Schéma BDD pollué par une table legacy — confusion lors des migrations futures |
| m-20 | Oxlint configuré avec `--max-warnings=11957` dans apps/web — indicateur d'un backlog de warnings non traités | apps/web | `apps/web/package.json` | 11 957 warnings lint tolérés = qualité de code front non maîtrisée |

---

## Métriques globales

| Indicateur | Valeur |
|-----------|--------|
| Dette CRITIQUE | 3 items |
| Dette MAJEUR | 13 items |
| Dette MINEUR | 20 items |
| Couverture de tests API | Partielle — 47 fichiers pytest, mais 7 features sans test confirmé |
| Couverture de tests front | 0% (web, admin, space) — 2 fichiers Vitest uniquement dans apps/live |
| Features sans spec | 7 (draft-issues, exports, estimates, ai, admin/instance, space/public-board, favorites-stickies) |
| ADRs RETRO produits | 16 |
| ADR à valider (statut incertain) | 1 (RETRO-041 — critère Q3 non confirmé) |
| Features partiellement implémentées | 1 (webhooks — ProjectWebhook non câblé) |

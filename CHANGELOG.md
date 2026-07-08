# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) · Versioning : [SemVer](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **web/cycles-end-transfer** — Modal « End cycle » avec auto-transfert des work items incomplets vers un cycle cible (réutilise l'endpoint API `transfer-issues/` existant). Remplace les stubs CE `end-cycle/modal.tsx`, `additional-actions.tsx`, `transfer-hop-info.tsx`. (quick win CE — cf. NOTE-features-payantes-points-entree-ce.md)
- **web/work-item-duplicate** — Duplication d'un work item (sous-menu « Duplicate » + modal avec projet cible ; clone name/description/priority/dates, et state/labels/assignés/estimate si même projet). Remplace `copy-menu-helper.tsx` et `duplicate-modal.tsx` (CE).
- **web/estimates-edit** — Édition d'une estimation existante et suppression d'un point avec re-mapping des issues (phase A, sans système TIME). Remplace `estimates/update/modal.tsx` et `estimates/points/delete.tsx` (CE) ; nouvelle méthode dans `estimate.service.ts`.
- **api/pages-nested** — Pages imbriquées : endpoint `GET .../pages/:page_id/sub-pages/`, validation anti-cycle et contrainte même-projet sur l'écriture de `parent`, remplissage de `PageVersion.sub_pages_data`. UI web : expansion des sous-pages dans la liste + action « New sub-page ».
- **api/views-publish** — Publication/dépublication d'une vue projet via anchor (permission admin projet), rendu public SSR côté `space` (`/views/:anchor`) avec application serveur des filtres de la vue. Nouveaux services front + modal CE `views/publish/*`.
- **api/intake-email** — Ingestion d'intake par email : webhook signé HMAC-SHA256 (`X-Plane-Signature`), tâche Celery créant un `IntakeIssue` (`source=EMAIL`, `source_email`) avec sanitization HTML (RETRO-101) et arrivée en triage. Badge de provenance CE `inbox/source-pill.tsx`.
- **web/work-item-page-embed** — Commande slash `/page` dans la description d'un work item : crée une page projet, insère un bloc-page cliquable (façon Notion) et ajoute un lien retour vers la page sur le work item. Nouveau nœud Tiptap `page-embed` (`packages/editor`, persistance `div[data-block-type]` compatible sanitizer nh3, zéro modif backend) + carte/hook côté web (`components/editor/embeds/page-embed/*`). Canal `extendedEditorProps` (widget NodeView + option slash) câblé de bout en bout.

### Changed

### Fixed

- **api/views-publish (sécurité, critique)** — Les vues publiées appliquent désormais leurs `rich_filters` côté serveur (endpoints publics `space`). Auparavant le filtrage reposait sur le champ legacy `query`, jamais renseigné par l'UI actuelle : une vue filtrée publiée exposait tout le backlog du projet à un visiteur anonyme (liste + détail). Le filtre échoue désormais fermé (queryset vide) si un filtre stocké est inapplicable.
- **api/views-publish** — La suppression d'une vue dépublie son `DeployBoard` (l'anchor public ne reste plus actif après suppression). UI : l'action « Publish »/badge « Live » n'est proposée qu'aux admins (l'API réserve publish/unpublish à l'ADMIN projet).
- **api/pages-nested (sécurité)** — La validation du parent applique le filtre d'accès (`owned_by` ou public) et exclut les pages archivées : impossible de rattacher une sous-page sous la page privée d'un autre utilisateur, ni de l'utiliser comme oracle d'existence. Remontée d'ancêtres protégée contre les boucles infinies (set de visités) et re-parentage concurrent sérialisé (verrou `select_for_update` ordonné) pour empêcher la création de cycles.
- **web/pages-nested** — Une sous-page archivée individuellement reste atteignable dans l'onglet Archived et ne s'affiche plus sous un parent actif.
- **web/pages-nested** — L'action « New sub-page » est aussi disponible depuis la barre d'outils d'une page ouverte (`editor/toolbar/options-dropdown.tsx`), et plus seulement depuis le menu des lignes de la liste des pages.
- **api/intake-email (sécurité/robustesse)** — Webhook idempotent via `message_id` (dédup `external_id`), scope de throttle dédié (`intake_email`), et émission de l'activité + notification + version de description à la création (parité avec l'intake in-app). Correction du libellé i18n de la pastille de provenance.

### Removed

### BDD

- Migration `0122_alter_intakeissue_source` — ajout de la valeur `EMAIL` aux choices de `IntakeIssue.source` (AlterField, aucun SQL de données). Schéma dormant réutilisé (colonne `source_email` déjà présente).
- Aucune nouvelle table : `pages-nested` exploite `Page.parent` / `PageVersion.sub_pages_data` existants ; `views-publish` réutilise le modèle `DeployBoard`.

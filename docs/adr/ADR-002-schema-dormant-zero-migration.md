# ADR-002 — Exploiter le schéma dormant avant d'écrire une migration

| Champ     | Valeur                                                      |
| --------- | ----------------------------------------------------------- |
| Numéro    | ADR-002                                                     |
| Statut    | **Proposé** — brouillon à valider par le dev                |
| Date      | 2026-07-20                                                  |
| Auteur(s) | Brouillon assisté (Claude Code) — à reprendre au nom du dev |
| Owner     | Lucien Lin                                                  |
| Décideurs | Lucien Lin                                                  |
| Contexte  | Phase 2 — décision fondatrice, formalisée a posteriori      |
| Remplace  | —                                                           |
| Features  | \* (fondationnel, côté données)                             |
| App       | api                                                         |

## Justification (politique ADR v2.3.0)

| Champ                                | Valeur                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catégorie                            | DB-STRATEGY                                                                                                                                                                                                                                                                                    |
| Q1 — Coût de revert > 1j ?           | OUI — revenir sur ce principe signifierait remplacer les colonnes dormantes déjà exploitées par des tables parallèles, écrire les migrations correspondantes **et** migrer les données existantes de tous les modules concernés.                                                               |
| Q2 — Non-déductible du code ?        | OUI — `models.py` montre `is_time_tracking_enabled`, `is_issue_type_enabled` ou `Page.is_global`, mais **rien ne dit** que ces colonnes sont un _héritage dormant de la CE délibérément réutilisé_ plutôt que du code mort à nettoyer. Un dev pourrait légitimement les supprimer.             |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — **20 fichiers de specs** revendiquent explicitement « zéro migration » ; le principe a gouverné `views-access`, `workspace-pages`, `workspace-activity-log`, `bulk-operations`, `epics`, `sso-zelian`, entre autres.                                                                     |
| Q4 — Casse un invariant si ignoré ?  | OUI — créer une table parallèle là où une colonne dormante existe **casse l'upgrade in-place** vers une édition Commercial : à la bascule, les données vivraient au mauvais endroit et le code EE ne les verrait pas. La corruption est silencieuse et ne se révèle qu'au moment de l'upgrade. |

> ✅ Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

La CE de Plane conserve en base un **schéma plus riche que ses fonctionnalités**. Des tables et des colonnes existent sans aucun code pour les exploiter : `Project.is_time_tracking_enabled` et `is_issue_type_enabled` (toggles réels, modifiables, sans aucune UI), `Page.is_global` (discriminant wiki), `Page.parent` (self-FK pour les pages imbriquées), `IntakeIssue.source` / `source_email`, les tables `issue_types` / `project_issue_types`. C'est ce que l'upstream appelle le **schéma dormant** : il permet l'upgrade in-place d'une instance CE vers une édition payante sans migration de données.

Quand nous réimplémentons une fonctionnalité payante ([ADR-001](ADR-001-reimplementation-ce-clean-room.md)), deux chemins s'ouvrent : brancher notre code sur ce schéma dormant, ou créer nos propres modèles. Le choix engage la compatibilité future et la réversibilité.

## Options considérées

| Option                               | Description                                                                       | Effort estimé | Avantages                                                                        | Inconvénients                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A — Schéma dormant d'abord           | Chercher systématiquement la colonne/table existante avant d'écrire une migration | S             | Zéro migration dans la majorité des cas ; upgrade in-place préservé ; réversible | Demande une exploration du schéma avant chaque module                                |
| B — Modèles propres systématiques    | Créer nos tables `zelian_*` pour chaque feature                                   | M             | Indépendance totale vis-à-vis de l'upstream                                      | Rompt l'upgrade in-place ; duplique des colonnes existantes ; migrations à maintenir |
| C — Modifier les modèles CE en place | Étendre directement les modèles existants                                         | S             | Direct                                                                           | Conflits de rebase systématiques ; divergence du schéma upstream                     |

## Décision retenue

**Option choisie : A** — chercher le schéma dormant **avant** d'écrire une migration, et ne créer un modèle que lorsqu'il n'existe réellement rien (greenfield avéré).

Le résultat est mesurable : sur **129 migrations** au total, le projet n'en a ajouté que **cinq** (`0124_issue_properties` → `0128_milestones`), toutes pour du greenfield authentique — custom properties, worklogs, jalons. Tous les autres modules ont tenu à zéro migration.

Quand un modèle est vraiment nécessaire, il est ajouté **à côté** du schéma CE, sans modifier les modèles existants (option C écartée).

## Conséquences

### Positives

- **Zéro migration** pour la majorité des modules — 20 fichiers de specs le documentent.
- L'upgrade in-place vers une édition Commercial reste possible : les données sont là où le code EE les attendrait.
- Moins de surface de conflit lors des rebases upstream.
- Réversibilité : désactiver une de nos features, c'est remettre un toggle à `False`, pas défaire une migration.

### Négatives

- Exige une exploration du schéma existant avant chaque module — le travail de découverte précède le développement.
- Certaines colonnes dormantes sont **mal nommées** ou portent une sémantique upstream que nous détournons légèrement ; il faut le documenter dans la `spec-technique.md` du module.
- Nous dépendons de la stabilité de ces colonnes côté upstream.

### Ce qu'on s'interdit désormais

- **Écrire une migration sans avoir vérifié** qu'aucune colonne ou table dormante ne couvre le besoin. La vérification se consigne dans `tech-design.md`.
- Supprimer une colonne apparemment inutilisée sans vérifier qu'elle n'est pas un point d'ancrage dormant.
- Modifier un modèle CE en place quand une table adjacente suffirait.
- Livrer une migration sans que `makemigrations --check` soit propre.

## Ressources / Références

- `NOTE-features-payantes-points-entree-ce.md` §2.3 — inventaire du schéma dormant (nested pages, issue types, intake email, time tracking).
- Migrations du projet : `apps/api/plane/db/migrations/0124` → `0128` (les seules ajoutées sur 129).
- Colonnes dormantes citées : `apps/api/plane/db/models/project.py:98,100`, `apps/api/plane/db/models/page.py:51`.
- Voir aussi `.claude/rules/01-database.md` (migrations versionnées) et [ADR-001](ADR-001-reimplementation-ce-clean-room.md).

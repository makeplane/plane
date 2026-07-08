# Spec Fonctionnelle — Custom properties (propriétés de work item types) [PLAN]

| Champ   | Valeur                   |
|---------|--------------------------|
| Module  | api/work-item-properties |
| Version | 0.1.0                    |
| Date    | 2026-07-08               |
| Statut  | PLAN — à valider         |
| Source  | Cadrage 2026-07-08 (greenfield) + doc Plane Pro |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL, sans code plane-ee) des **custom properties** (feature Pro), en complément du module `api/work-item-types`.

---

## Contexte

Les work item types sont livrés (`api/work-item-types`). Les **custom properties** sont **entièrement greenfield** en CE (aucun modèle). Objectif : définir des propriétés custom attachées à un type de work item, et saisir/afficher/valider leurs valeurs sur les work items.

## Périmètre V1 (types de propriétés)

Types couverts : **Text** (single/paragraph/readonly), **Number** (decimal), **Boolean**, **Date**, **Dropdown** (OPTION single/multi), **Member picker** (RELATION user, single/multi), **URL**.
Reportés (suite) : Formula (Business, calculé), File, Email, Relation-issue, Release picker (Business).

## Règles métier (doc Plane Pro)

1. Une propriété est **attachée à un type** de work item, avec : `display_name` (≤255), `description`, `property_type`, `relation_type` (pour RELATION), `is_required` (mandatory), `is_multi` (single/multi pour OPTION/RELATION), `is_active` (visible ou non), `default_value`, `settings` (JSON : ex. format texte), `sort_order`.
2. Certains types **ne peuvent pas être obligatoires** (ex. texte read-only, boolean).
3. **Dropdown** : ≥1 option requise ; options = `name`, `is_active`, `is_default`, `sort_order`.
4. **Member picker** : sélection parmi les membres du projet ; les membres choisis peuvent être auto-abonnés (V1 : au moins créer la valeur ; l'auto-subscribe est un plus).
5. Propriétés **désactivables** plutôt que supprimées ; suppression = soft-delete.
6. À la création/édition d'un work item d'un type donné, les propriétés actives de ce type apparaissent dans le formulaire ; les valeurs `is_required` sont **validées** avant sauvegarde.
7. Accès : gestion des définitions = **ADMIN projet** ; saisie des valeurs = qui peut éditer le work item ; isolation projet/workspace stricte (le type et la propriété appartiennent au même projet que le work item).

## Hors V1
- Formula, File, Email, Relation-issue, Release picker.
- Scope workspace (Enterprise Grid), hiérarchie de types.

## Dépendances
| Dépendance | Spec | État |
|------------|------|------|
| api/work-item-types | docs/specs/api/work-item-types/ | ✅ (implémenté) |
| api/issues | docs/specs/api/issues/ | ✅ |

## Critères d'acceptation
- CRUD propriété + options (interne + externe MCP).
- Saisie/lecture des valeurs sur un work item, validation des obligatoires.
- Rendu des propriétés dans la modale + sidebar de détail selon le type.
- Filtre et activité des valeurs (au moins l'activité).
- Isolation projet/workspace (pas d'IDOR cross-tenant, comme pour `type_id`).

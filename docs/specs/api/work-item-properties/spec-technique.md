# Spec Technique — Custom properties

| Champ   | Valeur                   |
|---------|--------------------------|
| Module  | api/work-item-properties |
| Version | 0.1.0                    |
| Date    | 2026-07-08               |
| Statut  | IMPLÉMENTÉ v0.1.0 (2026-07-08) |

---

## État d'implémentation (2026-07-08)

Implémenté (backend + web), **vérifié par exécution réelle** :
- Backend : 3 modèles greenfield (`IssueProperty`, `IssuePropertyOption`, `IssuePropertyValue` à colonnes typées), migration `0124_issue_properties`, util de cast/validation, serializers, CRUD interne (session) + externe v1/MCP (définitions, options, valeurs), activité `property_value`. Types V1 : TEXT/DECIMAL/BOOLEAN/DATETIME/OPTION/RELATION(USER/ISSUE)/URL.
- `makemigrations --check` propre, migration `0124` appliquée à la BDD, **43 tests pytest verts**.
- Web : types `@plane/types` (IIssueProperty/Option/Value + enums), services + stores, handlers réels du `IssueModalProvider` (validation required + persistance), rendu polymorphe par type (modale + sidebar détail), panneau de gestion propriétés/options, activité. Typecheck web vert.

### Revue sécurité adversariale (5 findings minor confirmés, corrigés ; 0 critical/major)
1. `property_type`/`relation_type` rendus **immuables au PATCH** (interne + v1) — un changement orphelinait les valeurs typées stockées.
2. DECIMAL rejette **NaN/Infinity**.
3. `required` non contournable via éléments vides d'une liste `is_multi`.
4. **Cap** `MAX_MULTI_VALUES=100` sur les valeurs multi (anti-amplification).
> Le finding « isolation type/projet » a été **rejeté** en vérification : l'isolation (type∈projet, option∈propriété, member∈projet) est correcte.

### Reste à faire (non-bloquant, cf. open_issues du volet web)
- Router le panneau de gestion des propriétés dans les settings projet (page « Work item Types » à monter).
- Rendu read-only dans les layouts liste/spreadsheet ; picker RELATION-issue ; reset des valeurs en « create more » ; résolution des labels option/member dans l'activité.
- `useMemo` sur le context value du provider (warning perf mineur, pattern préexistant).

---

## Modèles (greenfield — 3 nouvelles tables + 1 migration)

### IssueProperty (définition)
```
workspace FK, project FK, issue_type FK (related_name="properties"),
display_name Char(255), description Text, property_type Char (enum),
relation_type Char (null ; USER|ISSUE pour RELATION),
is_required Bool(default False), is_multi Bool(default False),
is_active Bool(default True), default_value JSON/Text (nullable),
settings JSONField(default dict), sort_order Float(default 0),
external_source/external_id. db_table="issue_properties".
```
Enum `property_type` (TextChoices) : TEXT, DECIMAL, BOOLEAN, DATETIME, OPTION, RELATION, URL (+ EMAIL, FILE, FORMULA réservés, non exposés V1).

### IssuePropertyOption (choix des Dropdown)
```
workspace FK, project FK, property FK (related_name="options"),
name Char(255), description Text, is_active Bool, is_default Bool,
sort_order Float, logo_props JSON(optionnel), external_source/id.
db_table="issue_property_options".
```

### IssuePropertyValue (valeur par work item)
Stockage **typé** (une colonne par famille de type ; `is_multi` = plusieurs lignes par (issue, property)).
```
workspace FK, project FK, issue FK (related_name="property_values"),
property FK (related_name="values"),
value_text TextField(null), value_boolean Bool(null),
value_decimal Decimal(null), value_datetime DateTime(null),
value_uuid UUIDField(null),           # RELATION user/issue
value_option FK IssuePropertyOption(null),  # OPTION
external_source/id. db_table="issue_property_values".
```
Choix : colonnes typées (pas un JSON opaque) → requêtable/filtrable, cohérent avec le stockage EE. Le mapping property_type → colonne est centralisé dans un util (`plane/utils/issue_property.py`).

## Migration
1 migration `0124_issue_properties` (CreateModel × 3 + index sur FK + contraintes). Écrite à la main (imiter la dernière migration réelle ; enchaîner sur le leaf courant).

## API

### Interne (app, session)
- Définitions : `GET/POST /api/workspaces/:slug/projects/:project_id/issue-types/:type_id/properties/` + `GET/PATCH/DELETE .../properties/:property_id/`.
- Options : `.../properties/:property_id/options/` (+ /:option_id/).
- Valeurs : `GET .../issues/:issue_id/property-values/` (toutes), `POST/PATCH .../issues/:issue_id/properties/:property_id/values/` (set), soft-delete pour retirer.
- (Alternative valeurs : intégrer la persistance des valeurs au flux de create/update d'un work item — cf. provider web.)

### Externe (api v1, token — MCP)
Mapping des 9 outils : `create/update/delete/list_work_item_property`, `create_work_item_property_option`, `manage_work_item_type_properties`, `set/get_work_item_property_value` sous `/api/v1/.../work-item-types/:type_id/properties/` et `/api/v1/.../work-items/:issue_id/properties/...`.

### Permissions & isolation
- Définitions/options : mutations ADMIN projet ; lecture membre.
- Valeurs : édition = droit d'édition du work item.
- **Isolation stricte** (leçon du finding IDOR type_id) : toute propriété/option/type référencée doit appartenir au **même projet** que le work item ; valider par queryset scopé `project_id` (400 sinon). Pas d'oracle.

## Validation des valeurs
- Typage : caster/valider la valeur selon property_type (décimal, datetime ISO, bool, uuid membre du projet, option appartenant à la propriété, URL).
- `is_required` : refuser la sauvegarde d'un work item du type si une propriété obligatoire active n'a pas de valeur.
- `is_multi` : plusieurs lignes ; sinon une seule (remplacer).

## Activité
Verbe `property_value` (changement d'une valeur de propriété) dans `bgtasks/issue_activities_task.py`.

## Web (apps/web)

Remplacer les stubs CE custom-properties (résolus via `@/plane-web/*`) :
- `issue-modal/provider.tsx` : implémenter les handlers réels (aujourd'hui no-op) : `issuePropertyValues`, `setIssuePropertyValues`, `handlePropertyValuesValidation`, `handleCreateUpdatePropertyValues`, `getActiveAdditionalPropertiesLength`, `getIssueTypeIdOnProjectChange`.
- `issue-modal/modal-additional-properties.tsx`, `issue-details/additional-properties.tsx`, `issue-layouts/additional-properties.tsx` : rendu des champs par type.
- `issue-details/issue-properties-activity/root.tsx` : activité.
- UI de gestion des propriétés/options dans les settings du type (project settings « Work item Types »).
- Stores/services : `issue-property`, `issue-property-value` (+ `@plane/types` : IIssueProperty, IIssuePropertyOption, TIssuePropertyValues réel).

## Tests
- pytest : CRUD propriété/option/valeur (interne + v1), validation typée + required, isolation projet (IDOR), soft-delete, activité. Non exécutés (pas d'env BDD).

## Reste à faire / suites
- Formula (calculé), File, Email, Relation-issue, Release picker (Business).
- Auto-subscribe des membres via member-picker.

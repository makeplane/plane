# RETRO-021 — RBAC à 3 niveaux (ADMIN/MEMBER/GUEST) avec bypass ADMIN workspace et plafonnement de rôle projet

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | api/projects, api/workspaces, api/issues, api/cycles, api/modules, api/pages |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | AUTH |
| Q1 — Coût de revert > 1j ? | OUI — changer les valeurs numériques (20/15/5), la logique de bypass, ou le décorateur `allow_permission` nécessite de modifier toutes les vues DRF de toutes les features API (projects, issues, cycles, modules, pages, workspaces…), soit un refactoring transverse de plusieurs jours. |
| Q2 — Non-déductible du code ? | OUI — les valeurs numériques 20/15/5, la sémantique Admin/Member/Guest, la règle de bypass ADMIN workspace sur les endpoints niveau PROJECT, et la règle de plafonnement (rôle projet ≤ rôle workspace) ne se déduisent pas de `pyproject.toml` ni des configs ; elles sont de la logique métier enfouie dans `permissions/base.py` et dans la vue `member.py`. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — api/projects, api/workspaces, api/issues, api/cycles, api/modules, api/pages, api/intake utilisent tous `@allow_permission` avec les mêmes valeurs de rôle. Le plafonnement (rôle projet ≤ rôle workspace) croise api/projects/members et api/workspaces/members. |
| Q4 — Casse un invariant si ignoré ? | OUI — un endpoint ajouté sans `@allow_permission` expose des données à des rôles non autorisés (faille d'accès). Un ajout de membre sans vérification de plafonnement crée une élévation de privilège (un GUEST workspace deviendrait ADMIN projet). |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane est un outil de gestion de projet multi-tenant. L'accès aux ressources doit être contrôlé à deux niveaux : le workspace (organisation) et le projet (sous-unité). Les rôles doivent être hiérarchiques et cohérents entre les deux niveaux pour éviter les escalades de privilège.

## Décision identifiée

**Modèle RBAC à 3 niveaux numériques** :
- `ADMIN = 20`, `MEMBER = 15`, `GUEST = 5`

**Décorateur `allow_permission`** (`plane/app/permissions/base.py`) :
- Deux scopes : `level="WORKSPACE"` (vérifie `WorkspaceMember`) et `level="PROJECT"` (défaut, vérifie `ProjectMember`).
- **Bypass ADMIN workspace** : au niveau PROJECT, un utilisateur dont le rôle workspace est ADMIN et qui est membre actif du projet accède à l'endpoint indépendamment de son rôle projet.
- Le décorateur est appliqué méthode par méthode (pas un middleware global).

**Plafonnement de rôle projet** (`plane/app/views/project/member.py`) :
- Le rôle attribué dans un projet ne peut pas excéder le rôle de l'utilisateur dans le workspace.
- Un GUEST workspace ne peut pas être MEMBER ou ADMIN projet.
- Un ADMIN workspace ne peut pas se voir attribuer un rôle GUEST ou MEMBER dans un projet via l'API (validation à l'ajout et à la modification).

## Conséquences observées

### Positives
- Le modèle numérique (20/15/5) permet des comparaisons directes (`role >= ROLE.ADMIN.value`) sans table de lookup.
- Le bypass ADMIN workspace simplifie l'administration : un admin peut intervenir sur n'importe quel projet sans avoir besoin d'un rôle ADMIN explicite dans ce projet.
- Le plafonnement empêche les escalades de privilège inter-niveaux.

### Négatives / Dette
- Le décorateur est appliqué individuellement sur chaque méthode — un oubli est silencieux (pas de vérification globale en CI que toutes les méthodes exposées ont un décorateur).
- Le bypass ADMIN workspace est conditionnel à `ProjectMember.is_active=True` : un ADMIN workspace qui n'est pas membre du projet ne bénéficie pas du bypass. Ce comportement est non documenté et peut surprendre.
- Le plafonnement est implémenté dans la vue (`member.py`) et non dans un validateur ou une contrainte BDD — une insertion directe en base peut le contourner.
- Les valeurs numériques (20/15/5) sont des constantes magiques dupliquées dans plusieurs fichiers (`project.py`, `permissions/base.py`).

## Recommandation

**Garder** le modèle à 3 niveaux et le décorateur — il est simple et cohérent. Améliorer à terme :
1. Centraliser les constantes ROLE dans un seul module importé partout.
2. Ajouter un test CI qui vérifie que toutes les actions exposées ont un décorateur de permission.
3. Documenter explicitement dans les conventions que le bypass ADMIN workspace requiert `is_active=True` dans le projet.

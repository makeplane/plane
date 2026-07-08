# Rules workflow git — Zelian

> Valables sur tout projet. MCP GitHub obligatoire.

## Branches

| Type | Pattern | Base | Merge vers |
|------|---------|------|------------|
| Feature | `feat/<module>-<description>` | `main` | `main` (via PR) |
| Bugfix | `fix/<description>` | `main` | `main` (via PR) |
| Hotfix | `hotfix/<description>` | `main` | `main` (via PR, review accélérée) |
| Rétro | `retro/<projet>` | `main` | `main` (via PR) |

## Commits

Format : **Conventional Commits** (obligatoire).

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

Types autorisés : `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`, `ci`, `build`

Scope = nom du module (ex : `feat(auth): ajout login email/password`)

## Pull Requests

1. **Toujours via PR** — jamais de push direct sur `main`
2. PR créée via MCP GitHub (obligatoire)
3. Description de la PR : résumé des changements + lien vers la spec
4. Au minimum 1 review avant merge (sauf hotfix urgent documenté)
5. CI doit passer (lint + tests)
6. Squash merge recommandé pour garder un historique propre

## MCP GitHub

Le MCP `github` est **obligatoire** sur tout projet Zelian. Il permet à Claude Code de :

- Créer des PRs automatiquement
- Lire les issues et PRs existantes
- Ajouter des commentaires de review
- Vérifier le statut de la CI

Installation : voir le guide d'onboarding poste dev Zelian.

## Protection de branche `main`

Recommandations (à configurer sur GitHub) :

- Require pull request reviews before merging
- Require status checks to pass (lint, tests)
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

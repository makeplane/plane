# RETRO-002 — Architecture multi-provider par pattern Adapter avec callback post-auth

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | api/auth            |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | AUTH |
| Q1 — Coût de revert > 1j ? | OUI — réécrire la couche d'abstraction Adapter toucherait les 6 providers (email, magic, GitHub, Google, GitLab, Gitea), les 2 contextes de vues (app + space), et le contrat du callback post-auth qui orchestre les invitations workspace |
| Q2 — Non-déductible du code ? | OUI — le pattern Template Method (Adapter/CredentialAdapter/OauthAdapter), la séparation `set_user_data()` / `complete_login_or_signup()`, et le mécanisme de callback injecté ne sont pas visibles dans `requirements/base.txt` |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — toutes les vues auth (app et space × 6 providers) partagent cette architecture ; la spec `api/workspaces` dépend du callback `process_workspace_project_invitations` qui est exécuté via ce mécanisme |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev créant un nouveau provider sans injecter `callback=post_user_auth_workflow` produirait des utilisateurs qui rejoignent Plane sans que leurs invitations workspace en attente soient traitées, laissant des `WorkspaceMemberInvite` orphelins |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane supporte plusieurs modes d'authentification simultanément (email, magic link, 4 providers OAuth). Chaque mode partage une logique commune : normalisation de l'email, détection signup vs login, protection des comptes désactivés, création de profil, gestion des avatars. Un mécanisme d'extension post-auth est nécessaire pour traiter les invitations workspace sans coupler les providers à la logique workspace.

## Décision identifiée

La couche `adapter/` implémente le pattern Template Method :

- `Adapter` (base) : méthode template `complete_login_or_signup()` contenant toute la logique commune. Méthodes abstraites : `set_user_data()`, `set_token_data()`.
- `CredentialAdapter` : spécialise `Adapter`, appelle `set_user_data()` puis `complete_login_or_signup()`.
- `OauthAdapter` : spécialise `Adapter`, appelle `set_token_data()` + `set_user_data()` + `complete_login_or_signup()` + `create_update_account()`.

Un `callback` optionnel est injecté à la construction du provider et appelé par `complete_login_or_signup()` après la création/mise à jour de l'utilisateur, avant le retour. En production, `post_user_auth_workflow` est systématiquement injecté.

## Conséquences observées

### Positives
- Ajout d'un provider en n'implémentant que `set_token_data()` et `set_user_data()` — toute la logique commune est héritée
- Décorrélation entre la logique auth et la logique workspace (callback injectable)
- Les contextes app et space partagent les mêmes providers — seules les vues diffèrent
- Testabilité : `callback=None` permet de tester les providers sans déclencher le workflow post-auth

### Négatives / Dette
- La méthode `complete_login_or_signup()` dans `base.py` (~80 lignes) concentre beaucoup de responsabilités — création d'utilisateur, gestion d'avatar, sync IDP, activation de compte, callback
- Duplication des vues app/space (26 routes) — la logique est identique, seul le contexte de session diffère
- Pas d'interface formelle (ABC) — les méthodes abstraites ne sont pas déclarées via `abc.abstractmethod`

## Recommandation

Garder — l'architecture est saine et extensible. Envisager de formaliser l'interface `Adapter` avec `abc.ABC` et `@abstractmethod` pour rendre les contrats explicites. Investiguer si la duplication app/space peut être réduite par paramétrage.

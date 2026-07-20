# ADR-003 — `IS_ZELIAN_ENABLED` : bascule unique entre instance interne (SSO) et outil externe

| Champ     | Valeur                                                      |
| --------- | ----------------------------------------------------------- |
| Numéro    | ADR-003                                                     |
| Statut    | **Proposé** — brouillon à valider par le dev                |
| Date      | 2026-07-20                                                  |
| Auteur(s) | Brouillon assisté (Claude Code) — à reprendre au nom du dev |
| Owner     | Lucien Lin                                                  |
| Décideurs | Lucien Lin                                                  |
| Contexte  | Phase 2 — décision fondatrice, formalisée a posteriori      |
| Remplace  | —                                                           |
| Features  | api/sso-zelian, api/auth                                    |
| App       | api, web, space                                             |

## Justification (politique ADR v2.3.0)

| Champ                                | Valeur                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catégorie                            | AUTH                                                                                                                                                                                                                                                                                                                                               |
| Q1 — Coût de revert > 1j ?           | OUI — supprimer la bascule imposerait de choisir un mode en dur et de reprendre les 4 routes d'auth, l'exposition du flag sur `/api/instances/`, et les seams d'extension des deux apps front (web + space).                                                                                                                                       |
| Q2 — Non-déductible du code ?        | OUI — l'environnement montre des variables `ZELIAN_*`, mais **rien ne dit** que le flag est la bascule _unique_ du mode de déploiement, ni que seule la chaîne `"1"` active le SSO (`"true"` ou l'entier `1` n'activent rien), ni que les identifiants OAuth peuvent rester en place sans rien exposer.                                            |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — `docs/specs/api/sso-zelian` et `docs/specs/api/auth`, plus les surfaces `web` et `space` qui affichent ou non le bouton « Continue with Zelian ».                                                                                                                                                                                            |
| Q4 — Casse un invariant si ignoré ?  | OUI — avant le durcissement, le flag ne pilotait que **l'affichage du bouton** : les routes `/auth/zelian/…` restaient joignables en direct dès que des identifiants OAuth traînaient dans l'environnement. Un dev qui rétablirait ce comportement rouvrirait un chemin d'authentification non voulu en mode externe, sans que rien ne le signale. |

> ✅ Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane chez Zelian doit pouvoir servir deux usages qui s'excluent : **application interne** (les employés se connectent par le SSO Zelian, adossé au serveur OAuth 2.1 de Supabase Auth) ou **outil externe** (des tiers se connectent par l'authentification native de Plane). Le choix n'est pas figé et peut changer.

Sans point de bascule explicite, le mode se serait déduit de la présence d'identifiants dans l'environnement — un état implicite, invisible et dangereux : des identifiants oubliés valent activation.

⚠️ Cet ADR ne redocumente pas l'authentification de Plane elle-même. La session Django à double cookie relève de [RETRO-001](RETRO-001-auth-session-django.md) et le pattern multi-provider de [RETRO-002](RETRO-002-auth-multi-provider-adapter-pattern.md) : le provider Zelian s'y insère sans les modifier.

## Options considérées

| Option                                          | Description                                                       | Effort estimé | Avantages                                                                                 | Inconvénients                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A — Flag `IS_ZELIAN_ENABLED` lu par le provider | Une variable pilote l'affichage **et** l'accessibilité des routes | S             | Bascule dans les deux sens sans migration, sans rebuild, sans revert git ; état explicite | Nécessite un redémarrage de l'API (le cache d'instance dure 2 h)              |
| B — Déduire de la présence des identifiants     | Si `ZELIAN_CLIENT_ID` existe, le SSO est actif                    | XS            | Aucun flag à gérer                                                                        | État implicite ; des identifiants oubliés activent un chemin d'auth non voulu |
| C — Deux branches git                           | Une branche « interne », une branche « externe »                  | M             | Séparation nette                                                                          | Divergence permanente ; tout correctif à porter deux fois                     |
| D — Retirer le code en mode externe             | Supprimer provider et routes quand non utilisés                   | S             | Surface d'attaque nulle                                                                   | Amputation réversible seulement par revert git ; tests supprimés avec         |

## Décision retenue

**Option choisie : A** — `IS_ZELIAN_ENABLED` est la bascule unique, lue par `ZelianOAuthProvider.__init__` qui lève `ZELIAN_NOT_CONFIGURED` si la valeur n'est pas exactement la chaîne `"1"`.

La comparaison stricte à `"1"` suit la convention des autres flags Plane (`IS_GOOGLE_ENABLED`…) : `"true"` ou l'entier `1` **n'activent rien**. C'est volontairement peu permissif — une valeur approximative doit échouer visiblement plutôt que d'activer un chemin d'authentification par accident.

Le code du provider, les 4 routes et les tests **restent dans l'arbre quel que soit le mode** (option D écartée) : c'est un réglage, pas une amputation.

## Conséquences

### Positives

- La bascule dans les deux sens ne demande **ni migration, ni rebuild, ni revert git** — seulement `docker restart plane-api-1`.
- En mode externe, les variables `ZELIAN_*` peuvent rester en place sans rien exposer.
- L'état est explicite et auditable : `/api/instances/` publie `is_zelian_enabled`.
- Les tests du provider restent exécutés dans les deux modes.

### Négatives

- ⚠️ `/api/instances/` est **caché 2 heures** : le changement n'est pas immédiat côté front.
- Du code d'authentification inactif reste présent en mode externe — surface d'attaque non nulle, compensée par le refus au niveau du provider.
- Le flag doit être documenté partout où l'on décrit le déploiement, sous peine d'être oublié.

### Ce qu'on s'interdit désormais

- **Déduire le mode de la présence d'identifiants** dans l'environnement.
- Accepter une autre valeur que la chaîne `"1"` comme activation.
- Piloter le mode par suppression de code, de routes ou de tests.
- Introduire un second flag concurrent qui déciderait du même comportement.

## Ressources / Références

- `MODE-INTERNE-OU-EXTERNE.md` (racine du dépôt) — mode d'emploi de la bascule.
- `apps/api/plane/authentication/provider/oauth/zelian.py` — lecture du flag et refus.
- `apps/api/plane/license/api/views/instance.py:98,141` — exposition de `is_zelian_enabled`.
- `docs/specs/api/sso-zelian/` — spec du module (PKCE S256, `client_secret_basic`, mapping userinfo Supabase).
- Décisions liées : [RETRO-001](RETRO-001-auth-session-django.md), [RETRO-002](RETRO-002-auth-multi-provider-adapter-pattern.md), [ADR-001](ADR-001-reimplementation-ce-clean-room.md).

# Plane interne à Zelian, ou Plane externe ? — la bascule

Ce fork peut fonctionner dans deux modes. **Une seule variable les sépare : `IS_ZELIAN_ENABLED`.**
Aucune migration, aucun rebuild, aucun code à modifier pour passer de l'un à l'autre.

Ce choix n'est pas encore tranché côté Zelian. Le mode interne sert à faire la démo ;
le mode externe est celui que décrit aujourd'hui la note d'architecture Zelian
(`HUB-TOOLS-ANALYSE-auth-clients-et-plane.md`, architecture ①). Tant que la décision
n'est pas prise, **rien n'a été modifié dans le dépôt de documentation Zelian**.

---

## Mode « externe » — le défaut

```bash
# apps/api/.env
IS_ZELIAN_ENABLED="0"
```

C'est la valeur par défaut : sans rien faire, ce fork se comporte comme Plane CE standard.

- Le bouton « Continue with Zelian » **disparaît** de la mire (web et space).
- Les routes `/auth/zelian/…` et `/auth/spaces/zelian/…` **refusent** les requêtes
  (`ZELIAN_NOT_CONFIGURED`), même si les identifiants OAuth sont restés dans l'environnement.
- Les utilisateurs se connectent par **email + mot de passe**, **code email (OTP)**,
  ou **Google / GitHub OAuth** — l'authentification native de Plane.
- Plane n'a aucun lien d'identité avec Zelian. Il s'intègre uniquement par la donnée
  (API REST + webhooks), comme GitHub.

Les variables `ZELIAN_*` peuvent rester en place : elles sont simplement ignorées.
Rien à supprimer, rien à nettoyer.

## Mode « interne » — pour la démo

```bash
# apps/api/.env
IS_ZELIAN_ENABLED="1"
ZELIAN_AUTH_BASE_URL="https://<ref-projet>.supabase.co/auth/v1"
ZELIAN_CLIENT_ID="<client id OAuth Plane>"
ZELIAN_CLIENT_SECRET="<client secret>"   # jamais commité
```

- Le bouton « Continue with Zelian » apparaît sur la mire.
- Un membre connecté à une app Zelian arrive dans Plane **sans ressaisir de mot de passe**.
- L'authentification native de Plane **reste disponible** en parallèle — le mode interne
  ajoute une porte, il n'en ferme aucune.

Nécessite en plus la mire `@zelian/auth` (page `/oauth/consent`), qui vit dans le dépôt
`2026-zelian-insider`, branche `feat/auth-mire-sso`. Sans elle, la connexion SSO échoue.

## Basculer

```bash
# éditer apps/api/.env, puis :
docker restart plane-api-1
```

⚠️ La réponse de `/api/instances/` est **cachée 2 heures** (`@cache_response`). Après
la bascule, vider le cache ou attendre — sinon le bouton met jusqu'à 2 h à apparaître
ou disparaître côté navigateur.

## Ce qui reste en place dans les deux modes

Le code du provider, les 4 routes, les tests et le logo restent dans l'arbre quel que soit
le mode. C'est voulu : la bascule est un **réglage**, pas une amputation. Revenir en arrière
ne demande jamais de revert git.

Si Zelian tranche définitivement pour « Plane externe », la suppression propre consisterait à
retirer `provider/oauth/zelian.py`, `views/{app,space}/zelian.py`, leurs 4 routes, le seam
frontend et les tests associés — mais ce n'est **pas** nécessaire pour exploiter Plane en
mode externe, seulement pour alléger le fork.

## Où la bascule est implémentée

| Fichier | Rôle |
| --- | --- |
| `apps/api/plane/license/api/views/instance.py` | expose `is_zelian_enabled` sur `/api/instances/` |
| `apps/api/plane/authentication/provider/oauth/zelian.py` | refuse l'initialisation si le flag n'est pas `"1"` |
| `apps/web/core/hooks/oauth/extended.tsx` | affiche ou masque le bouton (web) |
| `apps/space/hooks/oauth/extended.tsx` | idem (space) |

Seule la valeur littérale `"1"` active le mode interne — `"true"`, `"yes"` ou `1` (entier)
ne l'activent pas, conformément à la convention des autres flags de Plane
(`IS_GOOGLE_ENABLED`, `IS_GITEA_ENABLED`…).

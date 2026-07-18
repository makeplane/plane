# Intégration SSO Zelian → Plane — instructions d'exécution (Claude Code)

> **Rôle de ce fichier.** Mode d'emploi complet et **exécutable du début à la fin** pour brancher le SSO
> Zelian (Supabase) sur notre fork **Plane CE**. Écrit pour être exécuté par Claude Code **dans le repo
> `C:\Stage\plane`** (avec des allers-retours dans le monorepo `2026-zelian-insider` pour la mire).
> Suis les étapes dans l'ordre. Chaque bloc de code est complet ; les chemins ont été vérifiés.
>
> **Gouvernance.** Décision actée : `HUB-TOOLS-ADR-005` (2026-07-12, accepté). Plane = **tiers de
> confiance** autorisé à faire du SSO via le serveur OAuth 2.1 de Supabase. Invariant non négociable :
> **les comptes `user_type=client` n'entrent JAMAIS dans Plane** (double garde : mire + provisioning).
> AGPL-3.0 : ces ajouts modifient le fork → couverts par l'obligation de publication déjà déclenchée.
> **Code clean-room à partir du provider `gitea` du CE — ne jamais copier depuis `plane-ee`.**

---

## 0. État actuel & ce qui reste à faire

**Déjà fait (ne pas refaire) :**

- La **mire + page de consentement** existent : app `@zelian/auth` dans le monorepo
  (`C:\Stage\2026-zelian-insider\packages\auth`), port dev **3102**. Elle porte `/login` et
  `/oauth/consent` (auto-approbation du client Plane, refus des `user_type=client`). Voir son
  `README-SPIKE.md`. **Cette app est le « Site URL » Supabase en dev.**
- L'ADR est accepté ; la doc 09/11 est amendée.

**À faire dans ce chantier (objet de ce fichier) :**

- **A.** Backend Plane : provider `zelian` (OIDC/OAuth2.1 + PKCE) + vues + routes + codes d'erreur + flag d'instance.
- **B.** Frontend Plane : activer le bouton « Continue with Zelian » via les seams d'extension.
- **C.** Config d'environnement (local d'abord, prod ensuite).
- **D.** Config Supabase (dashboard, projet **dev**).
- **E.** Lancement local + tests d'acceptation end-to-end.

**Cibles / domaines :**
| | Local (dev) | Prod |
|---|---|---|
| Plane web / api | `localhost:3000` / `localhost:8000` | `work.zelian.fr` (workspace `zelian`) |
| Mire + `/oauth/consent` | `localhost:3102` | `auth.zelian.fr` |
| Supabase (IdP + OAuth 2.1) | projet **dev** Cloud `*.supabase.co` | projet **prod** Cloud |

**Méthode générale : répliquer le provider `gitea`.** Avant d'écrire, repère les points de couture :

```bash
grep -rin "gitea" apps/api/plane/authentication apps/web/core/hooks/oauth packages/constants/src/auth packages/types/src/instance
```

---

## 1. Le flux à obtenir (deux cas, un seul provider)

- **Flux chaud** — l'utilisateur a déjà une session Zelian (il s'est connecté à une app interne / la mire) :
  clic « Continue with Zelian » sur Plane → aucun écran → il est dans le workspace.
- **Flux froid** — pas de session : clic → mire Zelian (`/login`) → retour automatique → connecté sur Plane.

```
Plane (localhost:3000/8000)                     Mire @zelian/auth (localhost:3102)      Supabase dev (*.supabase.co)
   │  ① clic "Continue with Zelian"
   │     GET /auth/zelian/  (génère state + PKCE)
   ├───────────────────────────────────────────────────────────────────────────────►  /auth/v1/oauth/authorize
   │                                                                                     │ ② redirige le navigateur
   │                                                                ◄────────────────────┘    vers Site URL + /oauth/consent?authorization_id=…
   │                                              /oauth/consent :
   │                                              session ? sinon /login → retour
   │                                              user_type=client ? → deny
   │                                              client_id ∈ whitelist Plane → approve
   │                                                      │ ③ approve
   │                                                      ├──────────────────────────►  (émet le code)
   │  ④ callback ?code=…                          ◄───────┘  redirect_to = Plane callback
   ◄──────────────────────────────────────────────────────────────────────────────
   │  GET /auth/zelian/callback/  → échange code+PKCE (Basic auth) → userinfo (sub,email,name)
   │  → User.get_or_create(email) → session Django → redirect app
```

---

## 2. Partie D d'abord — Config Supabase (projet DEV, dashboard)

> À faire (humain ou via Management API) **avant** le test. Sans ça, rien ne se connecte.

1. **Vérifier le serveur OAuth 2.1** (make-or-break) :
   ```bash
   curl -s https://<REF-DEV>.supabase.co/auth/v1/.well-known/openid-configuration \
     | grep -o '"authorization_endpoint":"[^"]*"'
   ```
   Doit renvoyer `.../oauth/authorize`. Sinon : Authentication → **OAuth Server** → activer.
2. **OAuth Server** : Authorization Path = `/oauth/consent`.
3. **URL Configuration** :
   - Site URL = `http://localhost:3102`
   - Redirect URLs : `http://localhost:3102/**` **et** `http://localhost:8000/**`
4. **OAuth Apps → Add a new client** :
   - Type **Confidential**, Redirect URI = `http://localhost:8000/auth/zelian/callback/`
   - Noter **Client ID** (→ mire + Plane front whitelist) et **Client Secret** (→ Plane backend).
5. **JWT signing keys** : asymétrique **ES256/RS256** (requis par le scope `openid`).
6. **Comptes de test** : un `user_type=internal` (doit passer) et un `user_type=client` (doit être refusé),
   `app_metadata.user_type` posé en conséquence.

---

## 3. Partie A — Backend Plane (`apps/api/plane/authentication`)

### 3.1 CRÉER `provider/oauth/zelian.py`

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse

import pytz

from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


class ZelianOAuthProvider(OauthAdapter):
    provider = "zelian"
    scope = "openid email profile"

    def __init__(self, request, code=None, state=None, callback=None,
                 code_challenge=None, code_verifier=None):
        (ZELIAN_AUTH_BASE_URL, ZELIAN_CLIENT_ID, ZELIAN_CLIENT_SECRET) = get_configuration_value([
            {"key": "ZELIAN_AUTH_BASE_URL", "default": os.environ.get("ZELIAN_AUTH_BASE_URL")},
            {"key": "ZELIAN_CLIENT_ID", "default": os.environ.get("ZELIAN_CLIENT_ID")},
            {"key": "ZELIAN_CLIENT_SECRET", "default": os.environ.get("ZELIAN_CLIENT_SECRET")},
        ])

        if not (ZELIAN_AUTH_BASE_URL and ZELIAN_CLIENT_ID and ZELIAN_CLIENT_SECRET):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ZELIAN_NOT_CONFIGURED"],
                error_message="ZELIAN_NOT_CONFIGURED",
            )

        parsed = urlparse(ZELIAN_AUTH_BASE_URL)
        if parsed.scheme not in ("https", "http"):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ZELIAN_NOT_CONFIGURED"],
                error_message="ZELIAN_NOT_CONFIGURED",
            )
        base = ZELIAN_AUTH_BASE_URL.rstrip("/")            # ex. https://<ref>.supabase.co/auth/v1

        self.token_url = f"{base}/oauth/token"
        self.userinfo_url = f"{base}/oauth/userinfo"
        self.code_verifier = code_verifier

        redirect_uri = (
            f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/zelian/callback/"
        )
        url_params = {
            "client_id": ZELIAN_CLIENT_ID,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        if code_challenge:                                 # PKCE — obligatoire (OAuth 2.1)
            url_params["code_challenge"] = code_challenge
            url_params["code_challenge_method"] = "S256"
        auth_url = f"{base}/oauth/authorize?{urlencode(url_params)}"

        super().__init__(
            request, self.provider, ZELIAN_CLIENT_ID, self.scope, redirect_uri,
            auth_url, self.token_url, self.userinfo_url, ZELIAN_CLIENT_SECRET,
            code, callback=callback,
        )

    def set_token_data(self):
        data = {
            "grant_type": "authorization_code",
            "code": self.code,
            "redirect_uri": self.redirect_uri,
            "code_verifier": self.code_verifier,
        }
        basic = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {"Accept": "application/json", "Authorization": f"Basic {basic}"}
        token_response = self.get_user_token(data=data, headers=headers)
        super().set_token_data({
            "access_token": token_response.get("access_token"),
            "refresh_token": token_response.get("refresh_token"),
            "access_token_expired_at": (
                datetime.now(tz=pytz.utc) + timedelta(seconds=int(token_response.get("expires_in")))
                if token_response.get("expires_in") else None
            ),
            "refresh_token_expired_at": None,
            "id_token": token_response.get("id_token", ""),
        })

    def set_user_data(self):
        # userinfo Supabase : sub (openid) · email, email_verified (email) · name, picture (profile)
        info = self.get_user_response()
        email = info.get("email")
        name = (info.get("name") or "").strip()
        first_name, _, last_name = name.partition(" ")
        super().set_user_data({
            "email": email,
            "user": {
                "provider_id": info.get("sub"),
                "email": email,
                "avatar": info.get("picture", ""),
                "first_name": first_name or (email.split("@")[0] if email else ""),
                "last_name": last_name,
                "is_password_autoset": True,
            },
        })
```

### 3.2 CRÉER `views/app/zelian.py`

> Copie de `views/app/gitea.py` (`Gitea*` → `Zelian*`, erreurs `ZELIAN_*`) **avec le PKCE ajouté**.
> Le squelette complet :

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64
import hashlib
import secrets
import uuid
from urllib.parse import urlencode, urljoin

from django.http import HttpResponseRedirect
from django.views import View

from plane.authentication.provider.oauth.zelian import ZelianOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import validate_next_path


class ZelianOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(validate_next_path(next_path))

        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(base_host(request=request, is_app=True), "?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            code_verifier = secrets.token_urlsafe(64)                     # 43–128 chars
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).decode().rstrip("=")
            request.session["state"] = state
            request.session["code_verifier"] = code_verifier
            provider = ZelianOAuthProvider(request=request, state=state, code_challenge=code_challenge)
            return HttpResponseRedirect(provider.get_auth_url())
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(base_host(request=request, is_app=True), "?" + urlencode(params))
            return HttpResponseRedirect(url)


class ZelianCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base_host_url = request.session.get("host")
        next_path = request.session.get("next_path")

        if state != request.session.get("state", "") or not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["ZELIAN_OAUTH_PROVIDER_ERROR"],
                error_message="ZELIAN_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(base_host_url, "?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            provider = ZelianOAuthProvider(
                request=request, code=code,
                code_verifier=request.session.get("code_verifier"),
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)
            path = str(validate_next_path(next_path)) if next_path else get_redirection_path(user=user)
            return HttpResponseRedirect(urljoin(base_host_url, path))
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(base_host_url, "?" + urlencode(params))
            return HttpResponseRedirect(url)
```

### 3.3 (OPTIONNEL) `views/space/zelian.py`

Le flux « space » (boards publics) est **secondaire** — les devs utilisent l'app web. Implémente-le
seulement si besoin, en copiant `views/space/gitea.py` + mêmes ajouts PKCE. ⚠️ Ne pas « corriger » le fait
que le provider construit toujours le `redirect_uri` d'app (`/auth/zelian/callback/`) : c'est le
comportement upstream (le retour vers space passe par `request.session["host"]`).

### 3.4 MODIFIER les fichiers backend existants

| Fichier                            | Modification exacte                                                                                                                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authentication/adapter/error.py`  | Dans le dict `AUTHENTICATION_ERROR_CODES`, ajouter `"ZELIAN_NOT_CONFIGURED": 5113,` et `"ZELIAN_OAUTH_PROVIDER_ERROR": 5124,`. **Vérifie d'abord** que 5113/5124 sont libres (`grep -n "5113\|5124" apps/api/plane/authentication/adapter/error.py`).                        |
| `authentication/adapter/oauth.py`  | Dans `authentication_error_code()`, ajouter avant le `else` : `elif self.provider == "zelian": return "ZELIAN_OAUTH_PROVIDER_ERROR"`.                                                                                                                                        |
| `authentication/views/__init__.py` | Ajouter : `from .app.zelian import ZelianCallbackEndpoint, ZelianOauthInitiateEndpoint` (et la variante space si faite).                                                                                                                                                     |
| `authentication/urls.py`           | Importer les endpoints depuis `.views`, puis ajouter 2 routes (modèle gitea) : `path("zelian/", ZelianOauthInitiateEndpoint.as_view(), name="zelian-initiate")` et `path("zelian/callback/", ZelianCallbackEndpoint.as_view(), name="zelian-callback")`.                     |
| `license/api/views/instance.py`    | Dans `InstanceEndpoint.get`, ajouter au tuple `get_configuration_value([...])` l'entrée `{"key": "IS_ZELIAN_ENABLED", "default": os.environ.get("IS_ZELIAN_ENABLED", "0")}` (et la variable dans le unpacking), puis `data["is_zelian_enabled"] = IS_ZELIAN_ENABLED == "1"`. |

Pas de migration DB : `get_configuration_value` retombe sur les variables d'env quand la clé n'est pas en
table. **Ne pas** modifier `license/management/commands/configure_instance.py`.

---

## 4. Partie B — Frontend Plane

| Fichier                                     | Modification                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/types/src/instance/auth-ee.ts`    | `export type TExtendedLoginMediums = "zelian";` (remplace `never`).                                        |
| `packages/types/src/instance/base.ts`       | Ajouter `is_zelian_enabled: boolean;` dans l'interface `IInstanceConfig`.                                  |
| `packages/constants/src/auth/extended.ts`   | `export const EXTENDED_LOGIN_MEDIUM_LABELS: Record<TExtendedLoginMediums, string> = { zelian: "Zelian" };` |
| `apps/web/core/hooks/oauth/extended.tsx`    | Remplacer le stub par le hook ci-dessous.                                                                  |
| `apps/web/app/assets/logos/zelian-logo.svg` | Créer (placeholder simple accepté).                                                                        |
| `apps/space/hooks/oauth/extended.tsx`       | (Optionnel, si flux space) même logique, URLs `\${API_BASE_URL}/auth/spaces/zelian/…`.                     |

**`apps/web/core/hooks/oauth/extended.tsx`** :

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs } from "@plane/types";
import zelianLogo from "@/app/assets/logos/zelian-logo.svg?url";
import { useInstance } from "@/hooks/store/use-instance";

export const useExtendedOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next_path");
  const { config } = useInstance();
  return {
    isOAuthEnabled: config?.is_zelian_enabled || false,
    oAuthOptions: [
      {
        id: "zelian",
        text: `${oauthActionText} with Zelian`,
        icon: <img src={zelianLogo} height={18} width={18} alt="Zelian" />,
        onClick: () => {
          window.location.assign(`${API_BASE_URL}/auth/zelian/${next_path ? `?next_path=${next_path}` : ``}`);
        },
        enabled: config?.is_zelian_enabled,
      },
    ],
  };
};
```

`useOAuthConfig` (`apps/web/core/hooks/oauth/index.ts`) fusionne déjà core + extended, et `auth-root.tsx`
affiche le bouton automatiquement quand `isOAuthEnabled` est vrai. Rien d'autre à câbler.

**SSO « sans clic » (optionnel, v1.1)** : dans `apps/web/core/components/account/auth-forms/auth-root.tsx`,
auto-redirect au montage si `config?.is_zelian_enabled && !error_code && searchParams.get("sso") !== "0"`
vers `\${API_BASE_URL}/auth/zelian/…`. **Garde impérative** : ne pas rediriger si `error_code` (sinon boucle),
et documenter `?sso=0` comme échappatoire email/mot de passe.

---

## 5. Partie C — Environnement Plane

`apps/api/.env` (local) — Supabase **dev**, callback **localhost** :

```bash
ZELIAN_AUTH_BASE_URL="https://<REF-DEV>.supabase.co/auth/v1"
ZELIAN_CLIENT_ID="<client id OAuth Plane>"
ZELIAN_CLIENT_SECRET="<client secret>"     # jamais commité
IS_ZELIAN_ENABLED="1"
```

Prod (plus tard) : `ZELIAN_AUTH_BASE_URL=https://<REF-PROD>.supabase.co/auth/v1`, secrets prod dans le
gestionnaire de secrets, et l'OAuth App Supabase prod pointe sur `https://work.zelian.fr/auth/zelian/callback/`.

⚠️ La réponse `/api/instances/` est **cachée 2 h** (`@cache_response`). Après activation, vider le cache :

```bash
docker compose -f docker-compose-local.yml exec api python manage.py shell -c \
  "from django.core.cache import cache; cache.clear()"
```

---

## 6. Partie E — Lancement local & tests d'acceptation

**Démarrage :**

```bash
# 1) Mire (monorepo)  → http://localhost:3102
cd C:\Stage\2026-zelian-insider
cp packages/auth/.env.example packages/auth/.env    # remplir SUPABASE dev + NEXT_PUBLIC_PLANE_OAUTH_CLIENT_ID
pnpm install
pnpm --filter @zelian/auth dev

# 2) Plane backend + fronts (repo plane)
cd C:\Stage\plane
docker compose -f docker-compose-local.yml up -d    # attendre migrations + curl http://localhost:8000/api/instances/ → 200
pnpm dev                                             # web → http://localhost:3000
```

**Tests, dans l'ordre :** 0. `curl .../.well-known/openid-configuration` → contient `oauth/authorize`.

1. `GET http://localhost:8000/api/instances/` → `"is_zelian_enabled": true` (après clear cache). Le bouton
   « Continue with Zelian » apparaît sur `http://localhost:3000`.
2. **Mire seule** : `http://localhost:3102/login` → connexion compte interne → revient connecté.
3. **SSO chaud** (session mire déjà ouverte dans le même navigateur) : sur Plane, clic « Continue with
   Zelian » → **aucun écran** → onboarding/workspace Plane. En DB : `User` + `Account(provider='zelian',
provider_account_id=<sub>)`.
4. **SSO froid** (navigation privée) : clic → mire `localhost:3102/login` → retour Plane connecté.
5. **Compte client** (`user_type=client`) : refus à la page de consentement, jamais de session Plane.
6. **Non provisionné + `ENABLE_SIGNUP=0`** : bannière `SIGNUP_DISABLED` (voir §7).
7. Sécurité : `state` altéré → erreur propre ; échange de token échoue sans `code_verifier` (PKCE actif) ;
   `next_path` externe refusé (`validate_next_path`).
8. `pytest` (module auth) + `ruff check .` (api) + `pnpm build` (front) passent.

---

## 7. Politique de comptes (config, pas code)

- Quand le provisioning (Mission 2) tourne : `ENABLE_SIGNUP=0` → seuls les comptes déjà provisionnés
  entrent par SSO ; un inconnu authentifié reçoit `SIGNUP_DISABLED`. **Pour le premier smoke-test**,
  provisionne d'abord ton propre compte, ou tolère le signup temporairement.
- `DISABLE_WORKSPACE_CREATION=1` pour éviter les workspaces sauvages.
- Offboarding : désactivation annuaire → `is_active=False` + la désactivation explicite Plane
  (`last_logout_time`) bloque déjà le SSO (`complete_login_or_signup`).
- Clients : doublement bloqués (mire + jamais provisionnés).

---

## 8. Dépannage

| Symptôme                           | Cause probable                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouton absent                      | cache 2 h de `/api/instances/` non purgé, ou `.env` non chargée par le conteneur api                                                                                      |
| 404 après « Continue with Zelian » | Authorization Path non configuré côté Supabase (redirige vers `<SiteURL>/oauth/consent` inexistant)                                                                       |
| `redirect_uri mismatch`            | slash final / host ≠ Redirect URI déclarée (`http://localhost:8000/auth/zelian/callback/`)                                                                                |
| Erreur au token endpoint           | Basic auth absent, `code_verifier` manquant (PKCE), ou secret régénéré                                                                                                    |
| Erreur `openid`/id_token           | projet Supabase encore en HS256 → passer en clés asymétriques                                                                                                             |
| Page consent en erreur REST        | `@supabase/supabase-js` sans namespace `.oauth` → le helper `oauthClient.ts` de la mire est déjà en repli REST ; ajuster les URLs si le status ≠ 200 (l'erreur s'affiche) |
| Boucle de redirection mire         | auto-redirect §4 sans le garde `error_code`                                                                                                                               |

---

## 9. Prod (rappel des différences, quand le local est validé)

- Déployer la mire `@zelian/auth` sur `auth.zelian.fr` ; Supabase prod : Site URL = `https://auth.zelian.fr`,
  Authorization Path = `/oauth/consent`, OAuth App Redirect URI = `https://work.zelian.fr/auth/zelian/callback/`.
- Plane prod `.env` : `ZELIAN_AUTH_BASE_URL` = projet prod, secrets dans le gestionnaire de secrets.
- Cookie mire prod : `NEXT_PUBLIC_COOKIE_DOMAIN=.zelian.fr` (SSO inter-apps) ; en local : **vide** (host-only).

---

## 10. Ordre d'exécution résumé

1. Config Supabase dev (§2) + vérif well-known.
2. Backend Plane : créer `provider/oauth/zelian.py`, `views/app/zelian.py` ; modifier `error.py`, `oauth.py`,
   `views/__init__.py`, `urls.py`, `license/api/views/instance.py` (§3).
3. Frontend Plane : `auth-ee.ts`, `base.ts`, `constants/auth/extended.ts`, `hooks/oauth/extended.tsx`, logo (§4).
4. `.env` Plane local (§5), clear cache.
5. Lancer mire + Plane, dérouler les tests 0→8 (§6).
6. `pytest` + `ruff` + `pnpm build`. Commit sur branche `feat/sso-zelian`.

> Contexte détaillé & justification d'architecture : `PLAN-SSO-SUPABASE-PLANE.md` (même repo) et
> `HUB-TOOLS-ADR-005` (repo docs). La mire est déjà écrite dans le monorepo — **ne pas la recréer**,
> juste la configurer et la lancer.

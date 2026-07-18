# PLAN — SSO Zelian (Supabase) sur Plane CE

> ✅ **DÉBLOQUÉ — `HUB-TOOLS-ADR-005` accepté le 2026-07-12 par Anthony.**
> L'exception qui autorise Plane à faire du SSO par l'identité (via le serveur OAuth 2.1 Supabase) est
> **actée**. Ce plan est exécutable. Reste à propager l'amendement dans `09` / `11` /
> `HUB-TOOLS-ANALYSE-auth-clients-et-plane.md` (tâche doc, non bloquante pour le code).
> Domaine cible confirmé : **`work.zelian.fr`**, workspace **`zelian`**.

> **Fichier d'instructions pour Claude Code.**
> Objectif : un collaborateur déjà connecté à une app interne Zelian (Onboarding, School, …)
> arrive sur Plane **déjà connecté** — sans mot de passe Plane, sans invitation, sans écran intermédiaire.
> Date : 2026-07-12 · Base : fork Plane CE v1.3.1 (`C:\Stage\plane`) · IdP : Supabase Auth (projet Zelian, Cloud)

---

## 0. Contexte (à lire avant de coder)

- **Identité maître Zelian = Supabase Auth** (`auth.users`), un seul pool, `user_type` `internal`/`client`
  (cf. `2026-zelian-insider-docs/docs/09-architecture-auth.md`, statut `DÉCIDÉ` depuis le 2026-07-11 ;
  Supabase **Cloud** tranché le même jour — le point « self-hosted à vérifier » du §9 devient théorique).
- **Plane est un outil TIERS** (pas une app Zelian first-party) : le SSO interne par cookie `.zelian.fr`
  ne s'applique pas à lui. Le protocole correct pour franchir cette frontière est **OIDC/OAuth 2.1** —
  exactement le rôle du **serveur OAuth 2.1/OIDC de Supabase Auth** (GA bêta 2026, dispo sur Cloud).
- Plane CE n'inclut pas de SSO OIDC (feature payante), **mais** son module d'auth est conçu en
  providers extensibles : `gitea` (provider OAuth à host configurable) est le **modèle exact à répliquer**.
  Le front a des seams d'extension prévus pour ça (`extended.tsx`, `auth-ee.ts`) — zéro hack.
- La **Mission 2** (provisioning des membres depuis l'annuaire, `GUIDE-implementation-approche-A.md`)
  reste la source des **membres** ; ce plan ajoute la **connexion**. Les deux sont complémentaires :
  provisioning = qui a un compte/workspace ; SSO = comment on entre.

**Deux flux à couvrir (intention Anthony, 2026-07-12) — le même provider `zelian` les gère tous les deux :**

- **Flux chaud** — l'utilisateur est déjà connecté à une app interne (A), il arrive sur `work.zelian.fr` :
  **aucun écran, aucun mot de passe**, il est déjà dans le workspace `zelian`. (SSO « comme entre apps internes ».)
- **Flux froid** — l'utilisateur ouvre `work.zelian.fr` directement sans session : mire Plane → « Continuer avec
  Zelian » → (éventuelle page de connexion Zelian) → **retour sur Plane** connecté.
- Nuance à garder en tête : entre apps internes first-party le SSO passe par le **cookie `.zelian.fr`** ;
  Plane, backend Django tiers, ne peut PAS lire ce cookie → il passe par le **flux OAuth** (invisible pour
  l'utilisateur). L'expérience est identique (pas de mot de passe), le mécanisme diffère — c'est exactement
  ce que `HUB-TOOLS-ADR-005` acte comme exception cadrée.

**Architecture retenue :**

```
┌─────────────────┐  ① clic « Continuer avec Zelian » (ou lien direct /auth/zelian/)
│ Plane (Django)  │ ────────────────────────────────────────────────┐
│ work.zelian.fr │                                                 ▼
└─────────────────┘                              https://<ref>.supabase.co/auth/v1/oauth/authorize
        ▲                                                           │ ② redirige vers la page
        │ ⑤ callback ?code=…                                        ▼    d'autorisation Zelian
        │    → échange code+PKCE → userinfo         ┌────────────────────────────────┐
        │    → get_or_create User → session Django  │ App interne (Site URL Supabase)│
        │                                           │ /oauth/consent                 │
        └───────────────────────────────────────────│ session Supabase déjà là →     │
                                                    │ ③ auto-approve (client trusted)│
                                                    │ ④ redirect vers Plane + code   │
                                                    └────────────────────────────────┘
```

- L'utilisateur connecté à une app interne a une session Supabase → l'étape ③ est **silencieuse**
  (aucun écran). Supabase mémorise en plus le consentement (`oauth_consents`) : les connexions
  suivantes sont auto-approuvées côté serveur.
- S'il n'est connecté nulle part : il voit **une seule fois** la mire de l'app interne, puis retombe
  dans le flux silencieux.

**Alternatives écartées** (ne pas y revenir sans ADR) :

- _Plane Commercial + OIDC natif_ : payant (seats), inutile puisqu'on maintient déjà un fork CE.
- _Google OAuth CE_ : SSO Google ≠ SSO Supabase ; ne couvre pas « connecté à Onboarding ⇒ connecté à Plane ».
- _Reverse-proxy d'auth (header REMOTE_USER)_ : non supporté par Plane, fragile.
- _Réutiliser directement le cookie `.zelian.fr` dans Plane_ : Plane est un backend Django tiers,
  hors du domaine de confiance first-party ; ce serait un contournement du modèle du doc 09.

---

## 1. Pré-requis à rassembler (bloquants, à demander si absents)

| Info                                                       | Où                                             | Exemple                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| URL du projet Supabase Zelian                              | Dashboard Supabase → Project Settings → API    | `https://abcdefgh.supabase.co`                                                  |
| App qui possède le **Site URL** Supabase                   | Dashboard → Authentication → URL Configuration | ex. `https://onboarding.zelian.fr`                                              |
| Accès au repo de cette app (pour y créer `/oauth/consent`) | —                                              | repo `2026-zelian-onboarding`                                                   |
| Domaine de l'instance Plane cible                          | —                                              | `https://work.zelian.fr` — workspace `zelian` (+ local `http://localhost:8000`) |
| Un gestionnaire de secrets pour `client_secret`            | règle Zelian 07                                | jamais commité                                                                  |

⚠️ Le serveur OAuth Supabase est en **bêta** : avant de coder, vérifier le contrat réel :

```bash
curl -s https://<ref>.supabase.co/auth/v1/.well-known/openid-configuration | jq
# vérifier : authorization_endpoint, token_endpoint, userinfo_endpoint,
# grant_types_supported (authorization_code), code_challenge_methods_supported (S256),
# token_endpoint_auth_methods_supported (client_secret_basic)
```

Adapter le provider (Partie 4) à ce que renvoie ce document de découverte s'il diffère.

---

## 2. Partie Supabase (dashboard — ~30 min, à faire par un humain ou via Management API)

1. **Activer le serveur OAuth** : Dashboard → **Authentication → OAuth Server** → activer.
   Y définir **Authorization Path** = `/oauth/consent` (relatif au Site URL — la page créée en Partie 3).
2. **Enregistrer le client Plane** : Dashboard → **Authentication → OAuth Apps → Add a new client** :
   - Nom : `Plane`
   - Type : **Confidential** (backend Django = peut garder un secret)
   - **Redirect URIs** (correspondance EXACTE, slash final compris) :
     - `https://work.zelian.fr/auth/zelian/callback/`
     - `http://localhost:8000/auth/zelian/callback/` (dev)
     - _(note : le flux « space » de Plane réutilise ce même callback app — cf. §4.1 ;
       inutile d'enregistrer `spaces/zelian/callback/` sauf si vous décidez de le différencier)_
   - Récupérer **Client ID** + **Client Secret** (affiché une seule fois) → gestionnaire de secrets.
3. **Clés JWT asymétriques** : le scope `openid` exige une signature asymétrique (ES256/RS256).
   Dashboard → Authentication → JWT keys : si le projet est encore en HS256 legacy, migrer
   (c'est de toute façon la règle normative du doc 09 §9.7 : ES256 + JWKS).
   ⚠️ Si d'autres apps Zelian vérifient les JWT avec le secret HS256 partagé, planifier cette
   rotation avec elles (Supabase fait une rotation progressive standby → in use).
4. Noter la base des endpoints : `https://<ref>.supabase.co/auth/v1`
   (authorize = `/oauth/authorize`, token = `/oauth/token`, userinfo = `/oauth/userinfo`).

---

## 3. Partie « page d'autorisation » (dans l'app qui possède le Site URL — PAS dans le repo Plane)

Supabase redirige `GET <SiteURL>/oauth/consent?authorization_id=<id>` pendant le flux.
Créer cette route dans l'app interne concernée (ex. Onboarding, Next.js + `@supabase/supabase-js` ≥ 2 récent).

**Logique exacte (pseudo-React, adapter au framework de l'app) :**

```tsx
// /oauth/consent — page CLIENT-side (a besoin de la session Supabase du navigateur)
const TRUSTED_FIRST_PARTY_CLIENT_IDS = [process.env.NEXT_PUBLIC_PLANE_OAUTH_CLIENT_ID!];

useEffect(() => {
  (async () => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id");
    if (!authorizationId) return setError("authorization_id manquant");

    // 1) session Supabase ?
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // → mire de l'app, puis retour ICI avec le même authorization_id
      location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }

    // 2) garde-fou : les comptes client n'entrent JAMAIS dans l'outillage interne
    if (session.user.app_metadata?.user_type === "client") {
      await supabase.auth.oauth.denyAuthorization(authorizationId);
      return setError("Compte client : accès réservé au portail Centrale.");
    }

    // 3) détails de la demande
    const details = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

    // 4) client first-party de confiance (Plane) → approbation SILENCIEUSE
    if (TRUSTED_FIRST_PARTY_CLIENT_IDS.includes(details.client_id)) {
      const { redirect_to } = await supabase.auth.oauth.approveAuthorization(authorizationId);
      location.href = redirect_to; // retour vers Plane avec le code
      return;
    }

    // 5) client inconnu → écran de consentement classique (Approuver / Refuser)
    setPendingAuthorization(details);
  })();
}, []);
```

Notes d'implémentation :

- Noms de méthodes d'après la doc Supabase (`supabase.auth.oauth.getAuthorizationDetails / approveAuthorization / denyAuthorization`) — **vérifier les signatures exactes** dans la version installée de supabase-js (feature bêta) ; fallback REST : `GET /auth/v1/oauth/authorizations/{id}` et `POST /auth/v1/oauth/authorizations/{id}/consent` avec le Bearer token de l'utilisateur.
- La mire `/login` de l'app doit **préserver `next`** et rediriger dessus après connexion.
- Ne jamais auto-approuver un `client_id` hors liste blanche (les futurs tiers/MCP passeront par le vrai écran).
- Après la première approbation, Supabase mémorise le consentement (table `oauth_consents`) et
  auto-approuve côté serveur les demandes suivantes aux mêmes scopes.

---

## 4. Partie Plane — backend Django (repo `C:\Stage\plane`, branche `feat/sso-zelian`)

> **Méthode : répliquer le provider `gitea` à l'identique**, avec 2 ajouts : **PKCE S256**
> (obligatoire chez Supabase) et **client_secret_basic** au token endpoint.
> Pour trouver tous les points de couture : `grep -ri gitea apps/api packages apps/web apps/space --include="*.py" --include="*.ts" --include="*.tsx" -l`

### 4.1 Fichiers à CRÉER

**`apps/api/plane/authentication/provider/oauth/zelian.py`** — sur le modèle de `gitea.py` :

```python
import base64
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse
import pytz

from plane.authentication.adapter.oauth import OauthAdapter
from plane.license.utils.instance_value import get_configuration_value
from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException


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
        base = ZELIAN_AUTH_BASE_URL.rstrip("/")          # ex. https://<ref>.supabase.co/auth/v1

        self.token_url = f"{base}/oauth/token"
        self.userinfo_url = f"{base}/oauth/userinfo"
        self.code_verifier = code_verifier

        redirect_uri = f"{'https' if request.is_secure() else 'http'}://{request.get_host()}/auth/zelian/callback/"
        url_params = {
            "client_id": ZELIAN_CLIENT_ID,
            "scope": self.scope,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
        }
        if code_challenge:                               # PKCE — obligatoire (OAuth 2.1)
            url_params["code_challenge"] = code_challenge
            url_params["code_challenge_method"] = "S256"
        auth_url = f"{base}/oauth/authorize?{urlencode(url_params)}"

        super().__init__(request, self.provider, ZELIAN_CLIENT_ID, self.scope, redirect_uri,
                         auth_url, self.token_url, self.userinfo_url, ZELIAN_CLIENT_SECRET,
                         code, callback=callback)

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

**`apps/api/plane/authentication/views/app/zelian.py`** — copie de `views/app/gitea.py`
(`GiteaOauthInitiateEndpoint` → `ZelianOauthInitiateEndpoint`, `GiteaCallbackEndpoint` → `ZelianCallbackEndpoint`,
erreurs `ZELIAN_*`), avec le **PKCE en plus** :

```python
# dans ZelianOauthInitiateEndpoint.get(), à la place de la création du provider :
import secrets, hashlib, base64 as b64
state = uuid.uuid4().hex
code_verifier = secrets.token_urlsafe(64)                       # 43–128 chars
code_challenge = b64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")
request.session["state"] = state
request.session["code_verifier"] = code_verifier
provider = ZelianOAuthProvider(request=request, state=state, code_challenge=code_challenge)
return HttpResponseRedirect(provider.get_auth_url())

# dans ZelianCallbackEndpoint.get(), à la création du provider :
provider = ZelianOAuthProvider(
    request=request, code=code,
    code_verifier=request.session.get("code_verifier"),
    callback=post_user_auth_workflow,
)
```

**`apps/api/plane/authentication/views/space/zelian.py`** — copie de `views/space/gitea.py`,
mêmes ajouts PKCE. ⚠️ Particularité upstream à conserver telle quelle : le provider construit
TOUJOURS le redirect_uri d'app (`/auth/zelian/callback/`), y compris pour le flux space —
le retour vers space fonctionne via `request.session["host"]` (posé par l'initiate space et
relu par le callback). Ne pas « corriger » ça, c'est le comportement de gitea/google en CE.

### 4.2 Fichiers à MODIFIER (backend)

| Fichier                                           | Modification                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/plane/authentication/adapter/error.py`  | ajouter `"ZELIAN_NOT_CONFIGURED": 5113` et `"ZELIAN_OAUTH_PROVIDER_ERROR": 5124` (codes libres — vérifier qu'ils le sont toujours)                                       |
| `apps/api/plane/authentication/adapter/oauth.py`  | dans `authentication_error_code()`, brancher `elif self.provider == "zelian": return "ZELIAN_OAUTH_PROVIDER_ERROR"`                                                      |
| `apps/api/plane/authentication/views/__init__.py` | exporter `ZelianOauthInitiateEndpoint`, `ZelianCallbackEndpoint` (+ variantes Space)                                                                                     |
| `apps/api/plane/authentication/urls.py`           | 4 routes : `zelian/`, `zelian/callback/`, `spaces/zelian/`, `spaces/zelian/callback/` (modèle gitea)                                                                     |
| `apps/api/plane/license/api/views/instance.py`    | ajouter `IS_ZELIAN_ENABLED` à `get_configuration_value` (default `os.environ.get("IS_ZELIAN_ENABLED", "0")`) puis `data["is_zelian_enabled"] = IS_ZELIAN_ENABLED == "1"` |

Pas de migration DB : `get_configuration_value` retombe sur les variables d'environnement quand
la clé n'existe pas en table `instance_configurations`. **Ne pas** toucher `configure_instance.py` (v1).

### 4.3 Configuration (env)

`apps/api/.env` (local) et env du déploiement prod :

```bash
ZELIAN_AUTH_BASE_URL="https://<ref>.supabase.co/auth/v1"
ZELIAN_CLIENT_ID="<client id OAuth Plane>"
ZELIAN_CLIENT_SECRET="<client secret>"     # gestionnaire de secrets en prod
IS_ZELIAN_ENABLED="1"
```

⚠️ La réponse `/api/instances/` est **cachée 2 h** (`@cache_response`). Après activation :

```bash
docker compose -f docker-compose-local.yml exec api python manage.py shell -c \
  "from django.core.cache import cache; cache.clear()"
```

---

## 5. Partie Plane — frontend (seams d'extension prévus, ne pas toucher aux fichiers core sauf mention)

| Fichier                                     | Modification                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/types/src/instance/auth-ee.ts`    | `export type TExtendedLoginMediums = "zelian";` (au lieu de `never`)                 |
| `packages/types/src/instance/base.ts`       | ajouter `is_zelian_enabled: boolean;` à `IInstanceConfig`                            |
| `packages/constants/src/auth/extended.ts`   | `EXTENDED_LOGIN_MEDIUM_LABELS = { zelian: "Zelian" }`                                |
| `apps/web/core/hooks/oauth/extended.tsx`    | implémenter le hook (voir ci-dessous)                                                |
| `apps/space/hooks/oauth/extended.tsx`       | idem, URLs `\${API_BASE_URL}/auth/spaces/zelian/…` (copier le pattern du core space) |
| `apps/web/app/assets/logos/zelian-logo.svg` | créer (placeholder simple si pas d'asset marque sous la main) ; idem côté space      |

**`apps/web/core/hooks/oauth/extended.tsx`** (le seam remplace le stub `isOAuthEnabled: false`) :

```tsx
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

(`useOAuthConfig` dans `index.ts` fusionne déjà core + extended — rien d'autre à brancher ;
`auth-root.tsx` affichera le bouton automatiquement.)

L'admin god-mode (`apps/admin`) n'est **pas** traité en v1 : la config passe par les variables
d'environnement, et l'admin d'instance continue de se connecter en email + mot de passe.

---

## 6. SSO « sans clic » (optionnel v1.1, recommandé)

Deux mécanismes complémentaires :

1. **Liens profonds depuis l'écosystème** (zéro modif Plane) : le launcher Tools / les liens internes
   pointent vers `https://work.zelian.fr/auth/zelian/?next_path=/zelian/` (slug du workspace) → session
   déjà là, tout est silencieux de bout en bout. C'est le flux « connecté à l'app A ⇒ déjà connecté sur Plane ».
2. **Auto-redirect de la mire Plane** : dans `apps/web/core/components/account/auth-forms/auth-root.tsx`
   (fichier core — modification à isoler proprement dans le fork), ajouter :

```tsx
// au montage : SSO d'office, avec échappatoire ?sso=0 pour l'admin local
// (searchParams existe déjà dans auth-root.tsx ; importer API_BASE_URL de @plane/constants)
const ssoParam = searchParams.get("sso");
const nextPathParam = searchParams.get("next_path");
useEffect(() => {
  if (config?.is_zelian_enabled && !error_code && ssoParam !== "0") {
    window.location.assign(`${API_BASE_URL}/auth/zelian/${nextPathParam ? `?next_path=${nextPathParam}` : ``}`);
  }
}, [config?.is_zelian_enabled, error_code]);
```

Garde-fous impératifs : ne PAS rediriger si `error_code` est présent (sinon boucle infinie sur échec),
et documenter `https://work.zelian.fr/?sso=0` comme porte de secours email/mot de passe.

---

## 7. Politique de comptes (à configurer, pas à coder)

- **`ENABLE_SIGNUP=0`** (env + éventuelle ligne `instance_configurations`) dès que le provisioning
  Mission 2 tourne : seuls les comptes **déjà provisionnés depuis l'annuaire** (donc existants côté
  Plane) peuvent entrer par SSO ; un inconnu authentifié par Supabase reçoit `SIGNUP_DISABLED`.
  Pour le premier smoke test : provisionner son propre compte d'abord (ou tolérer signup temporairement).
- **`DISABLE_WORKSPACE_CREATION=1`** : évite qu'un utilisateur SSO non-membre crée des workspaces sauvages.
- **Offboarding** : désactivation côté annuaire → `is_active=False` (Mission 2) + la désactivation
  explicite Plane (`last_logout_time` posé) bloque le SSO (déjà géré par `complete_login_or_signup`).
- **Sync des profils** : laisser `ENABLE_ZELIAN_SYNC` inexistant/off — l'annuaire reste maître des
  noms via le provisioning (sens unique annuaire → Plane).
- Les **clients** (`user_type=client`) sont doublement bloqués : refus à la page d'autorisation (Partie 3)
  et jamais provisionnés (donc `SIGNUP_DISABLED` même si la 1re garde sautait).

---

## 8. Tests d'acceptation (dans l'ordre)

0. `curl` du `.well-known/openid-configuration` (Partie 1) — contrat vérifié.
1. **Découverte config** : `GET http://localhost:8000/api/instances/` → `"is_zelian_enabled": true`
   (après clear du cache Redis). Le bouton « Continue with Zelian » apparaît sur `localhost:3000`.
2. **SSO chaud** (session Supabase déjà ouverte dans le navigateur sur l'app interne) :
   clic sur le bouton → **aucun écran** → onboarding Plane ou workspace. Vérifier en DB :
   `User` + ligne `Account (provider='zelian', provider_account_id=<sub>)`.
3. **SSO froid** (navigation privée) : clic → mire de l'app interne → login → retour Plane connecté.
4. **Reconnexion** : logout Plane → re-clic → silencieux (consentement mémorisé côté Supabase).
5. **Compte client** : refus à la page d'autorisation, jamais de session Plane.
6. **Non provisionné + `ENABLE_SIGNUP=0`** : bannière `SIGNUP_DISABLED` sur la mire Plane.
7. **Sécurité** : rejouer le callback avec un `state` altéré → erreur propre ; vérifier que le
   token exchange échoue sans `code_verifier` (PKCE actif) ; `next_path` externe refusé
   (`validate_next_path`).
8. **Space** : flux `spaces/zelian` sur une board publique protégée.
9. `pytest` du module auth + `ruff check .` (api) + `pnpm build` (front) passent.

**Dépannage courant :**

| Symptôme                            | Cause probable                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Bouton absent                       | cache 2 h de `/api/instances/` non purgé, ou env non chargée par le conteneur api                   |
| 404 après « Continuer avec Zelian » | Authorization Path non configuré côté Supabase (redirige vers `<SiteURL>/oauth/consent` inexistant) |
| `redirect_uri mismatch`             | slash final ou host différent de la Redirect URI déclarée                                           |
| Erreur au token endpoint            | Basic auth absent, ou `code_verifier` manquant (PKCE), ou secret régénéré                           |
| Erreur `openid`/id_token            | projet encore en JWT HS256 → migrer vers clés asymétriques (Partie 2.3)                             |
| Boucle de redirection mire          | auto-redirect §6 sans le garde `error_code`                                                         |

---

## 9. Gouvernance Zelian (à faire en parallèle, hors code)

1. **`HUB-TOOLS-ADR-005` — ACCEPTÉ le 2026-07-12** (« Intégration Plane par l'identité — SSO via serveur
   OAuth 2.1 Supabase », `docs/specs/tools/`). Amende doc 11 §11.1 et §11.10. Reste à **propager**
   l'amendement dans le corps de `09`, `11` et l'analyse HUB-TOOLS (mettre à jour la phrase « jamais au
   niveau identité » et la clause « aucun humain » du serveur OAuth). Skill `zelian-adr` pour la traçabilité.
   L'invariant client reste intact : **les clients ne touchent jamais Plane** (proxy Centrale).
2. **Registre `05-flux-de-donnees.md` §5.1** : ajouter à la ligne Plane la dépendance identité
   (consommateur du serveur OAuth Supabase), en plus de la ligne données (mode C vers Centrale).
3. **AGPL-3.0** : cette extension modifie Plane → l'obligation de publication des sources du fork
   (déjà déclenchée par la Mission 2) couvre aussi ces fichiers. Code 100 % clean-room à partir du
   provider `gitea` CE — **ne jamais copier depuis `plane-ee`**.
4. Secrets (`ZELIAN_CLIENT_SECRET`) : gestionnaire de secrets, jamais dans le repo (règle 07).
5. **Risque suivi** : le serveur OAuth Supabase est documenté côté Cloud (bêta) ; si Zelian migre
   un jour vers Supabase self-hosted (règle de souveraineté du doc 09 §9.10), re-vérifier la
   disponibilité de la feature dans l'image GoTrue self-hosted AVANT la migration — même point
   de vigilance que `HUB-TOOLS-ANALYSE` §10.

---

## 10. Ordre d'exécution & estimation

| #   | Étape                                                                 | Où                 | Durée estimée |
| --- | --------------------------------------------------------------------- | ------------------ | ------------- |
| 1   | Vérif discovery + activation OAuth Server + client `Plane` + clés JWT | Dashboard Supabase | 0,5 h         |
| 2   | Page `/oauth/consent` + préservation `next` sur la mire               | app du Site URL    | 1–2 h         |
| 3   | Backend Plane (provider + views + urls + erreurs + instance.py)       | repo plane         | 2–3 h         |
| 4   | Frontend Plane (extended hooks + types + labels + logo)               | repo plane         | 1 h           |
| 5   | Env + smoke tests locaux (scénarios 0–4)                              | local              | 1 h           |
| 6   | `ENABLE_SIGNUP=0` + tests 5–8 + déploiement                           | prod               | 1 h           |
| 7   | ADR + registre + note AGPL                                            | insider-docs       | 0,5 h         |

**Total : ~1 jour.** Le chemin critique est la Partie 2 (accès dashboard Supabase) — tout le reste
se code hors ligne. Commencer par `git checkout -b feat/sso-zelian` dans le repo Plane.

---

## Sources

- Supabase — [OAuth 2.1 Server (vue d'ensemble)](https://supabase.com/docs/guides/auth/oauth-server) · [Getting Started (activation, OAuth Apps, Authorization Path, client_secret_basic, openid ⇒ clés asymétriques)](https://supabase.com/docs/guides/auth/oauth-server/getting-started) · [OAuth Flows (endpoints exacts, page d'autorisation, PKCE obligatoire, méthodes supabase-js)](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows)
- Comportement serveur (userinfo par scope, `oauth_consents`, auto-approbation) : [DeepWiki supabase/auth — OAuth Server Mode](https://deepwiki.com/supabase/auth/10.3-oauth-server-mode) · gotcha consent path : [supabase/auth#2408](https://github.com/supabase/auth/issues/2408)
- Zelian : `docs/09-architecture-auth.md` (§9.3 first/third-party, §9.7 ES256, §9.9 serveur OAuth 2.1),
  `docs/specs/tools/HUB-TOOLS-ANALYSE-auth-clients-et-plane.md` (architectures ①/②, licences Plane),
  repo plane : `NOTE-features-payantes-points-entree-ce.md` §2.2 (seams SSO), `NOTE-faisabilite-sync-supabase.md`,
  `GUIDE-implementation-approche-A.md` (provisioning), code CE : `apps/api/plane/authentication/*` (modèle gitea).

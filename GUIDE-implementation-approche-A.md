# Approche A — Guide d'implémentation (peupler Plane depuis l'annuaire)

> Objectif : que tous les employés apparaissent comme **membres actifs** (donc cherchables/affectables) dans Plane, **sans invitation**. Ce guide répond précisément à : *quel intermédiaire ? comment lit-il l'annuaire ? quel endpoint, dans quel fichier ? quel ORM, déjà configuré ?*

---

## 🗺️ Vue d'ensemble : 2 côtés, 2 ORM

```
   CÔTÉ ANNUAIRE (leur monde)                CÔTÉ PLANE (notre instance)
   • base PostgreSQL (Supabase)              • base PostgreSQL (celle de Plane)
   • ORM = Prisma (TypeScript)               • ORM = Django (Python)
          │                                         ▲
          │  ①② l'INTERMÉDIAIRE lit + prépare        │ ④ l'ENDPOINT écrit
          └────────── ③ HTTP  (X-API-Key) ───────────┘
```

**À retenir :** l'**intermédiaire** (notre code) lit l'annuaire et **envoie une requête HTTP** à Plane. C'est l'**endpoint dans Plane** qui écrit en base, via **l'ORM de Django**. L'intermédiaire ne touche jamais l'ORM de Plane.

---

## 🔄 Le flux en 4 étapes

| # | Étape | Qui le fait | Avec quoi |
|---|-------|-------------|-----------|
| ① | **Lire** l'annuaire (qui va dans Plane) | Intermédiaire | Prisma / SQL |
| ② | **Transformer** en liste `{email, prénom, nom, rôle}` | Intermédiaire | code |
| ③ | **Envoyer** la liste à Plane | Intermédiaire | HTTP `POST` + header `X-API-Key` |
| ④ | **Créer** les membres actifs | Endpoint Plane | ORM Django |

---

## ⚡ Réponses express à tes questions

| Ta question | Réponse courte |
|-------------|----------------|
| **Quel intermédiaire ?** | Un petit programme **à nous**, séparé de Plane. Idéalement une **tâche planifiée (cron) dans l'appli d'onboarding existante** (elle a déjà Prisma + l'accès à l'annuaire). |
| **Comment lit-il l'annuaire ?** | Une requête sur la base PostgreSQL qui **joint 3 tables** : `user_permissions` (app='plane') + `referent_profile` + `auth.users` (pour l'email). |
| **Appeler l'endpoint dans quel fichier ?** | Côté intermédiaire : un simple `fetch`. Côté Plane : **2 fichiers à créer** — `api/views/provision.py` (la vue) + `api/urls/provision.py` (la route). |
| **Quel ORM ?** | **L'ORM de Django** (celui intégré à Django 4.2). |
| **Plane en a déjà un ?** | **Oui**, celui de Django. Pas d'ORM tiers. |
| **Comment le configurer ?** | **Rien à faire** : déjà configuré (`settings/common.py`, via les variables `POSTGRES_*`). On l'**utilise**, point. |

---

## 1️⃣ L'intermédiaire (notre programme)

- **Ce que c'est :** un programme **à nous, privé, hors de Plane**. Son unique rôle : *lire l'annuaire → préparer une liste → appeler Plane*.
- **Forme recommandée :** une **tâche cron** ajoutée à l'appli `2026-zelian-onboarding` (elle possède déjà Prisma et l'accès à l'annuaire → **zéro nouvelle infrastructure**). Alternative : un mini-service autonome (Node/TS ou Python).
- **Fréquence :** une exécution planifiée (ex. chaque nuit) suffit — 8 utilisateurs, aucune contrainte de performance.

---

## 2️⃣ Lire l'annuaire Zelian

L'annuaire est une **base PostgreSQL**. L'intermédiaire s'y connecte **en lecture** et joint 3 tables :

```sql
SELECT  u.email,  rp.first_name,  rp.last_name
FROM        public.user_permissions  up
JOIN        auth.users               u   ON u.id = up.user_id          -- ← l'EMAIL est ici
JOIN        public.referent_profile  rp  ON rp.user_id = up.user_id
WHERE       up.app = 'plane';                                          -- ← qui doit être dans Plane
```

- **Outil :** le **client Prisma** déjà présent (ou `@supabase/supabase-js`, ou `psycopg` en Python).
- **Identifiants :** l'intermédiaire utilise **ses propres accès** en lecture à la base (aucun secret ne m'est transmis).

> ⚠️ **Seule zone d'ombre à confirmer avec le prof :** d'après le schéma fourni, l'**email n'est pas dans `referent_profile`** — il est dans la couche identité `auth.users`. Il faut donc soit lire `auth.users`, soit vérifier qu'une colonne email existe ailleurs. *(C'est le seul point non tranché.)*

---

## 3️⃣ L'endpoint côté Plane — quels fichiers

**Côté intermédiaire** (notre code) — un simple appel HTTP :

```ts
await fetch(`${PLANE_URL}/api/v1/workspaces/${slug}/provision-members/`, {
  method: "POST",
  headers: { "X-API-Key": PLANE_TOKEN, "Content-Type": "application/json" },
  body: JSON.stringify({ members: [{ email, first_name, last_name, role: 15 }, /* … */] }),
});
```

**Côté Plane** — l'API externe est montée sur **`/api/v1/`** (`plane/urls.py:21`). On ajoute **2 fichiers** :

| Fichier | Action | Rôle |
|---------|--------|------|
| `apps/api/plane/api/views/provision.py` | **créer** | La vue qui reçoit la liste et crée les membres. Hérite de `BaseAPIView` → **clé API automatique** (`api/views/base.py:49-52`). |
| `apps/api/plane/api/urls/provision.py` | **créer** | Déclare la route `POST /workspaces/<slug>/provision-members/`. |
| `apps/api/plane/api/urls/__init__.py` | **modifier** | Y brancher la nouvelle route (1 ligne d'import + 1 ligne dans la liste). |

*(Le header attendu est bien `X-API-Key`, déjà autorisé dans la config CORS — `common.py:192`.)*

---

## 4️⃣ L'ORM — lequel, et comment le « configurer »

- **Lequel :** l'**ORM de Django** (intégré à Django 4.2). Pas d'ORM tiers.
- **Déjà présent et configuré :** la connexion à la base est dans `apps/api/plane/settings/common.py:207-216` (elle lit les variables `POSTGRES_*` que le conteneur Plane possède déjà). Les modèles sont dans `apps/api/plane/db/models/`.
- **Donc : rien à configurer.** Quand notre code tourne **dans** le processus Django de Plane, il a **automatiquement** la connexion. On se contente d'**utiliser** les modèles :

```python
# apps/api/plane/api/views/provision.py  (illustratif)
from plane.db.models import User, Profile, Workspace, WorkspaceMember   # ← l'ORM Django

class ProvisionMembersAPIEndpoint(BaseAPIView):        # clé API gérée par BaseAPIView
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        for p in request.data.get("members", []):
            user, _ = User.objects.get_or_create(       # crée le compte s'il n'existe pas
                email=p["email"].strip().lower(),
                defaults={"username": uuid4().hex,
                          "first_name": p.get("first_name", ""),
                          "is_password_autoset": True},  # compte sans mot de passe choisi
            )
            Profile.objects.get_or_create(user=user)     # profil requis par Plane
            WorkspaceMember.objects.update_or_create(    # membre ACTIF de l'espace
                workspace=workspace, member=user,
                defaults={"role": p.get("role", 15), "is_active": True},
            )
        return Response({"provisioned": ...}, status=200)
```

`User.objects.get_or_create(...)` / `.update_or_create(...)` = **c'est ça, « utiliser l'ORM »** : on parle à la base **à travers les modèles de Plane** (donc on respecte ses règles), **jamais** en SQL brut.

---

## 📁 Récapitulatif — fichiers concernés

| Côté | Fichier | Action |
|------|---------|--------|
| Intermédiaire (notre code) | requête de lecture annuaire + appel `fetch` | créer |
| Plane | `apps/api/plane/api/views/provision.py` | créer |
| Plane | `apps/api/plane/api/urls/provision.py` | créer |
| Plane | `apps/api/plane/api/urls/__init__.py` | modifier (2 lignes) |
| Plane | *(rien pour l'ORM ni la base — déjà configurés)* | — |

---

## ⚠️ En résumé

1. **Intermédiaire** = petit programme à nous (idéalement dans l'appli onboarding) → lit l'annuaire avec **Prisma**.
2. Il **POST** la liste des gens à **`/api/v1/workspaces/<slug>/provision-members/`** de Plane, avec la clé `X-API-Key`.
3. L'**endpoint** (2 fichiers ajoutés à Plane) utilise **l'ORM de Django (déjà configuré)** pour créer des **membres actifs**.
4. **Seule question ouverte** : où lire l'email (a priori `auth.users`).

*Note : ce guide est un plan d'implémentation ; on ne code rien tant que l'URL de l'instance + la clé API (PAT) + le slug du workspace ne sont pas fournis.*

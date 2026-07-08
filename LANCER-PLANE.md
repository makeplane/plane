# 🚀 Lancer Plane en local (Windows + Docker Desktop + WSL2)

> Mémo de démarrage rédigé après la première mise en route réussie.
> Architecture : backend **dockerisé** (Django + Postgres + Redis/Valkey + RabbitMQ + MinIO + Celery), fronts **hors Docker** via `pnpm dev` (Vite/Turborepo).

---

## Prérequis (à faire une seule fois)

- **Docker Desktop** installé et **lancé** (icône 🐳 verte) — s'appuie sur **WSL2**.
- **Node ≥ 22**, **pnpm 11.3** (`corepack enable pnpm`), **Git Bash** (les scripts `.sh` ne tournent pas sous PowerShell).

```bash
cd /c/Stage/plane
bash setup.sh          # crée les .env (racine + web/api/space/admin/live), génère la SECRET_KEY Django, pnpm install
```

> ⚠️ Lancer `setup.sh` depuis **Git Bash**, pas PowerShell (il utilise `/dev/urandom`).

---

## Démarrage quotidien

```bash
cd /c/Stage/plane

# 1) Backend (API + workers + infra)
docker compose -f docker-compose-local.yml up -d
#    → 1er boot : le conteneur "migrator" applique des centaines de migrations (~8 min). PATIENTER.
#    → API prête quand : curl http://localhost:8000/api/instances/  →  HTTP 200

# 2) Fronts (NE PAS interrompre le démarrage)
pnpm dev
```

Accès :

| Service | URL |
|---------|-----|
| **App principale (web)** | http://localhost:3000 |
| Admin instance | http://localhost:3001/god-mode/ |
| Vue publique (space) | http://localhost:3002/spaces/ |
| API Django | http://localhost:8000 |

---

## Arrêter / relancer

```bash
# Fronts : Ctrl-C dans le terminal `pnpm dev`
docker compose -f docker-compose-local.yml stop    # stoppe le backend (conserve les données)
docker compose -f docker-compose-local.yml up -d   # relance (rapide, migrations déjà faites)

# Tout supprimer (conteneurs + volumes/données) :
# docker compose -f docker-compose-local.yml down -v
```

---

## ⚙️ Réglages appliqués au repo (ne pas annuler)

Ajoutés dans **`pnpm-workspace.yaml`** (pnpm 11 lit ses réglages ici, **plus** dans `.npmrc`) :

```yaml
verifyDepsBeforeRun: false   # évite que turbo relance un `pnpm install` par package ("Recreating node_modules" en boucle)
confirmModulesPurge: false   # pas de prompt interactif de purge (utile en arrière-plan / CI)
```

> Sans ces réglages, `pnpm dev` boucle sur des réinstallations par package (très lent) et échoue en mode non-interactif avec `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.

---

## 🛠️ Dépannage (problèmes réellement rencontrés)

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `docker: command not found` | Docker Desktop pas lancé / PATH non rafraîchi | Lancer Docker Desktop, rouvrir le terminal |
| Build image API : `I/O error` sur `libLLVM`/`libc.a` (`apk add`) | Couche disque WSL2 instable (souvent au 1er run) | `docker builder prune -af` puis **`wsl --shutdown`**, attendre que Docker reparte, rebuild |
| API ne répond pas pendant plusieurs minutes | Migrations Django en cours (`migrator`) | Attendre ; suivre `docker compose -f docker-compose-local.yml logs -f migrator` |
| `'turbo' n'est pas reconnu` / `node_modules` cassé | Install interrompu en plein milieu | `pnpm install` **complet, sans l'interrompre**, puis `pnpm dev` |
| `pnpm dev` boucle sur `Recreating node_modules` | `verifyDepsBeforeRun` (pnpm 11) | Vérifier les 2 réglages dans `pnpm-workspace.yaml` |

---

## ⚠️ Limite connue : uploads de fichiers

Au démarrage, `create_bucket` échoue avec :

```
Could not connect to the endpoint URL: "http://localhost:9000/uploads"
```

Côté **serveur**, le conteneur API doit joindre MinIO via le nom de service `plane-minio:9000`, pas `localhost:9000` (qui désigne le conteneur API lui-même). Connexion, projets, issues, cycles, etc. **fonctionnent** ; seuls les **uploads** (avatars, pièces jointes) sont impactés tant que ce n'est pas corrigé.

**Piste de correction** (à valider) : dans `apps/api/.env`, distinguer l'endpoint interne (serveur → `plane-minio:9000`) de l'endpoint navigateur (presigned URLs → `localhost:9000`). Voir les variables `AWS_S3_ENDPOINT_URL` / `MINIO_ENDPOINT` / `USE_MINIO` du projet.

---

## Stack (rappel)

Voir `.claude/rules/02-stack.md` pour le détail complet. Monorepo pnpm + Turborepo : `apps/api` (Django), `apps/web|admin|space` (React Router v7), `apps/live` (Express/Hocuspocus), `apps/proxy` (Caddy).

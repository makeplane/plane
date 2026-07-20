# CLAUDE.md — Plane (fork Zelian)

> Version : 1.3.1 — 2026-07-20
> Framework Zelian : `framework_version: 3.0.0`
> Marker projet : voir `.zelian/project.json` (source de vérité depuis v2.1.0)
>
> ℹ️ **Ce fichier est volontairement versionné bien que `.gitignore:104` le liste.** La ligne vient
> du dépôt upstream et y reste, pour éviter un conflit à chaque synchronisation ; `.gitignore` ne
> s'applique qu'aux fichiers non suivis, donc elle est sans effet ici. **Ne pas « corriger »
> l'incohérence** en retirant la ligne ou en désindexant le fichier.

<!--
  ⚠️  CE FICHIER DOIT RESTER COURT — max 80 lignes.
  C'est un INDEX qui pointe vers les bons fichiers, pas un dump du projet.

  Où va chaque type d'info :
  - Stack, commandes, conventions     → .claude/rules/02-stack.md
  - Patterns architecturaux, auth     → docs/adr/RETRO-*.md
  - Schema BDD, API, tests            → docs/specs/*/spec-technique.md
  - Regles metier, cas d'usage        → docs/specs/*/spec-fonctionnel.md
  - Conventions de nommage            → .claude/rules/00-global.md
  - Strategie de test                 → .claude/rules/04-testing.md

  NE JAMAIS ajouter ici : blocs de code, schemas BDD, pipelines CI/CD, details d'infra.
-->

## Apps

| App     | Root         | Stack                                       |
| ------- | ------------ | ------------------------------------------- |
| `api`   | `apps/api`   | Django 4.2 + Celery — API REST + workers    |
| `web`   | `apps/web`   | React Router v7.15.1, SSG (`ssr: false`)    |
| `admin` | `apps/admin` | React Router v7.15.1, SSG                   |
| `space` | `apps/space` | React Router v7.15.1 — publication publique |
| `live`  | `apps/live`  | Express + Hocuspocus/Yjs — collaboration    |
| `proxy` | `apps/proxy` | Caddy                                       |

> Config multi-app : `.claude/zelian-apps.json` · Détail complet : `.claude/rules/02-stack.md`

**Infra** : PostgreSQL 15.7 · Valkey 7.2 (Redis) · RabbitMQ 3.13 · MinIO · pnpm 11.3 + Turbo

## Commandes

```bash
pnpm dev                    # tous les services (web :3000, live :3100)
pnpm check:types            # typegen + tsc --noEmit
pnpm check:lint             # oxlint          (le hook pre-commit refuse TOUT avertissement)
pnpm --filter @plane/i18n sync:check   # parite des 19 locales
docker compose -f docker-compose-local.yml up -d   # API :8000 + infra
```

## Rules actives

- @.claude/rules/00-global.md
- @.claude/rules/01-database.md
- @.claude/rules/02-stack.md
- @.claude/rules/03-retro.md
- @.claude/rules/04-testing.md
- @.claude/rules/05-git-workflow.md
- @.claude/rules/06-adr-policy.md
- @.claude/rules/07-context-discipline.md

## Modules

**33 modules spécifiés** — `docs/specs/{api,web,live}/<module>/`. Répartition : 27 `api`, 5 `web`, 1 `live`.

⚠️ **Ne PAS parcourir `docs/specs/` pour trouver le bon module.** La source de vérité du mapping
code ↔ doc est **`.zelian/compass.json`** (Zelian Compass v3) :

```bash
# ⚠️ Ne pas recopier le motif des docs du framework (`*/zelian-framework/hooks/lib/*`) :
# il oublie le dossier de version, et depuis WSL le plugin vit côté Windows.
COMPASS=$(find ~/.claude/plugins /mnt/c/Users/*/.claude/plugins \
  -name compass.js -path '*/zelian-framework/*/hooks/lib/*' 2>/dev/null | tail -1)
node "$COMPASS" --resolve <fichier>          # fichier  -> module + ses docs
node "$COMPASS" --resolve-prompt "<demande>" # demande  -> features candidates
```

Lecture **ciblée** obligatoire : voir `.claude/rules/07-context-discipline.md`.

**Note :** la `spec-technique.md` peut ne pas exister en première implémentation — lire alors
`spec-fonctionnel.md` et les ADR. Les ADR de ce projet sont des `RETRO-XXX` (projet repris par
`/zelian:retro`), il n'y a pas d'`ADR-001`.

## Écarts framework connus

Trois décalages entre les règles et ce dépôt, documentés au **§14.6 du handoff** : les hooks du
plugin ne s'exécutent pas dans toutes les sessions (invoquer `@update-writer-after-implement`
à la main), `/zelian:new-spec` est bloqué par sa garde `ADR-001`, et le score qualité n'est pas
envoyé (`api.enabled: false`). **« TDD obligatoire » (`04-testing.md`) reste inapplicable au front.**

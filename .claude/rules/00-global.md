# Rules globales — Zelian

> Valables sur tout projet, quelle que soit la stack. Fichier copié depuis le plugin `zelian-framework` par `/zelian:init` — ne pas modifier au projet.
> Pour les règles transverses complètes (SemVer Zelian, protocole /context, dashboard), voir la doc framework dans le plugin : `~/.claude/plugins/zelian-framework/docs/02-regles-transverses.md` (ou la version GitHub : `zelian-codespace/zelian-framework/blob/main/docs/02-regles-transverses.md`).

## Règles absolues

1. Lire les specs AVANT de toucher au code — utiliser le **protocole unique d'injection `/context`** (voir DOC 2 §4.4)
2. Lire l'ADR concerné AVANT toute modification d'architecture ou de BDD
3. **Mettre à jour `CHANGELOG.md` à chaque feature complétée — une entrée par feature, obligatoire** (vérifié par le hook Stop)
4. Aucun `console.log` / `var_dump` / `dd()` commité en production
5. Nouvelle décision architecturale : ADR écrit en amont SI déjà connue avant le dev, sinon `update-writer-after-implement` la proposera — JAMAIS d'ADR écrit à la main en plein milieu d'une session Superpowers. **`@update-writer-after-implement` est invoqué automatiquement après chaque implémentation** : depuis v2.2.0, le hook `Stop` émet `{"decision": "block", "reason": "<EXTREMELY_IMPORTANT>...</EXTREMELY_IMPORTANT>"}` sur stdout — l'assistant chaîne automatiquement, identique au pattern Superpowers. Anti-boucle via `stop_hook_active`.
6. **Tout ADR créé par un agent automatique** (`@retro-documenter`, `@update-writer-after-implement`) **DOIT** passer la politique `06-adr-policy.md` : whitelist de 7 catégories (STACK, AUTH, DB-STRATEGY, SECURITY, DATA-MODEL, REPRODUCIBILITY, BREAKING-CHANGE), checklist 4 questions Y/N, 7 anti-patterns. **Aucune décision hors politique ne peut être promue en ADR** — elle va en `spec-technique.md`. Bloc « Justification » obligatoire dans chaque ADR.
7. Superpowers est utilisé **en natif** — aucune surcharge des skills Superpowers

## Workflow imposé

```
lire spec → /superpowers:brainstorm → /superpowers:write-plan → valider plan
         → /superpowers:execute-plan → @update-writer-after-implement (forcé par le hook Stop via decision:block depuis v2.2.0)
         → review humaine → commit → score qualité envoyé au dashboard Zelian
```

Pas d'implémentation sans avoir suivi les étapes dans l'ordre.

## Subagents Zelian disponibles

- `@update-writer-after-implement` — **obligatoire après chaque implémentation, invocation forcée par le hook `Stop`** via `{"decision": "block", "reason": "<EXTREMELY_IMPORTANT>...</EXTREMELY_IMPORTANT>"}` (depuis v2.2.0, mécanisme officiel Claude Code identique au pattern Superpowers). L'assistant chaîne automatiquement, anti-boucle via `stop_hook_active`. Synchronise `docs/specs/`, `VERSIONNING.md`, `schema.md` et `CHANGELOG.md` avec le code réel.
- `@stack-detector` — détecte la stack technique d'un projet repris et génère `.claude/rules/02-stack.md` (Phase 1-bis uniquement, invoqué par `/zelian:retro`)
- `@retro-scanner` — découverte de codebase (Phase 1-bis uniquement)
- `@retro-documenter` — documentation par feature (Phase 1-bis uniquement)
- `@retro-auditor` — synthèse et audit (Phase 1-bis uniquement)

## Skills Zelian disponibles (via plugin)

- `/zelian:init <TEMPLATE> <DESIGN>` — initialise un projet neuf (télécharge stack + design, crée `.zelian/project.json`)
- `/zelian:retro` — orchestrateur de rétro-ingénierie pour projet repris (Phase 1-bis, lance `@stack-detector` + 3 subagents retro)
- `/zelian:new-spec [app/]<feature>` — scaffolde `docs/specs/[app/]<feature>/` (4 fichiers, garde ADR-001)
- `/zelian:spec-writer` — interview guidée 4-phases pour rédiger une `spec-fonctionnel.md` directement dans Claude Code (alternative à Claude chat)
- `/zelian:migrate` — migration de version majeure du framework (auto-détection v2.0.x → v2.1.0)
- `/zelian:config <init|show|set|reset>` — gère `~/.zelian/config.json` (user_id dev, gate API opt-in)

## Commande debug

- `/debug` — commande native Claude Code. Aucune surcharge Zelian.

## Règles transverses renvoyées vers DOC 2

- **SemVer Zelian (X.0.0 humain, 0.X.0 feature, 0.0.X patch)** → DOC 2 §4.2
- **Protocole unique d'injection `/context`** → DOC 2 §4.4
- **MCPs par stack** → DOC 2 §4.5
- **Convention commits et branches** → DOC 2 §4.6
- **Dashboard Zelian et events.log** → DOC 2 §4.10

## Conventions universelles (rappel court)

- Commits : Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `chore`, `test`)
- Branches : `feat/<module>-<description>`, `fix/<description>`, `hotfix/<description>`, `retro/<projet>`
- Variables d'env : `SCREAMING_SNAKE_CASE`
- Pas de breaking change sans ADR
- Voir aussi `04-testing.md` (stratégie de tests) et `05-git-workflow.md` (workflow git + MCP GitHub obligatoire)

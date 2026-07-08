# Rules rétro-ingénierie — Zelian

> Charger uniquement sur un projet repris (Phase 1-bis). Retirer après la fin de la Phase 1-bis.

## Objectif

Documenter un codebase existant sans le modifier. Produire des specs, ADRs et un audit exploitable pour la suite du développement.

## Workflow rétro

```
/zelian:retro
  → retro-scanner (discovery)
  → retro-documenter (boucle par feature)
  → retro-auditor (synthèse + audit)
```

## Règles absolues

1. **Ne JAMAIS modifier le code existant pendant la Phase 1-bis** — documenter uniquement
2. Les specs produites sont marquées `[DRAFT — à valider par le dev]`
3. Les ADRs produits sont préfixés `RETRO-` (ex : `RETRO-001-auth-jwt.md`)
4. Les décisions techniques existantes sont documentées "as-is", pas jugées
5. Le plan de remédiation priorise par criticité : CRITIQUE > MAJEUR > MINEUR

## Outputs attendus

- `docs/retro/audit-initial.md` — rapport complet
- `docs/retro/dette-technique.md` — dette classée par criticité
- `docs/retro/plan-remediation.md` — plan de correction priorisé
- `docs/specs/<feature>/spec-fonctionnel.md` — par feature identifiée (DRAFT)
- `docs/specs/<feature>/spec-technique.md` — reflet technique du code existant
- `docs/adr/RETRO-XXX-*.md` — ADRs des décisions identifiées

## Après la Phase 1-bis

1. Retirer `03-retro.md` des rules actives dans `CLAUDE.md`
2. Valider les specs DRAFT avec le dev responsable (retirer le tag DRAFT)
3. Commencer la Phase 2 (ADRs fondateurs) en s'appuyant sur l'audit

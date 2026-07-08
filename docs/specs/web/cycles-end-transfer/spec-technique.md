# Spec Technique — Fin de cycle & auto-transfert

| Champ      | Valeur                  |
|------------|--------------------------|
| Module     | web/cycles-end-transfer |
| Version    | 0.1.0                   |
| Date       | 2026-07-07              |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07) |

---

## Architecture

Remplacement de stubs CE (alias `@/plane-web/*` → `apps/web/ce/*`). L'API est déjà fonctionnelle : seul le front est à écrire.

## Fichiers concernés

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/cycles/end-cycle/modal.tsx` | Modal de fin de cycle | stub `return <></>` (props `transferrableIssuesCount`, `cycleName` déjà typées) |
| `apps/web/ce/components/cycles/additional-actions.tsx` | Bouton/action « End cycle » | stub `<></>` |
| `apps/web/ce/components/issues/issue-details/sidebar/transfer-hop-info.tsx` | Historique de transfert d'un item | stub `<></>` |

## Schéma BDD

Aucune migration : tables cycles existantes. Snapshot de progression déjà géré côté API (RETRO-041).

## API

- Existant : `POST /api/workspaces/:slug/projects/:projectId/cycles/:cycleId/transfer-issues/` (payload `new_cycle_id`) — ne pas modifier.
- À vérifier : endpoint de comptage des items transférables (sinon dériver du store MobX cycle courant).

## Tests

- Composant : modal (React Testing Library) — rendu conditionnel, sélection cible, appel service.
- Pas de test API (endpoint existant, couvert côté api).

# Spec Fonctionnelle — Relation work item ↔ pages (« Link pages ») [SCAFFOLD — à valider]

| Champ   | Valeur              |
|---------|---------------------|
| Module  | api/work-item-pages |
| Version | 0.1.0               |
| Date    | 2026-07-08          |
| Statut  | PLAN — à valider avant implémentation |
| Source  | Décision design 2026-07-08 (comparatif Free/Pro/Business/Enterprise) |

> ⚠️ Garde ADR-001 bypassée (décision dev). Réimplémentation CE (AGPL) d'une feature équivalente au plan **Pro** de Plane (« Link pages »), préparée pour Business (pages wiki) et Enterprise (GAC, audit, isolation multi-workspace). Aucun code plane-ee copié.

---

## Contexte et objectif

Permettre de **lier une ou plusieurs pages à un work item** (et inversement de lister les pages d'un work item), comme le fait Plane Pro via le bouton « Link pages ». La relation est de **première classe** (table dédiée), requêtable dans les deux sens, et exposée sur l'**API externe token-auth** pour être pilotable par le serveur MCP (`attach_page_to_work_item`, `detach_page_from_work_item`, `list_work_item_pages`).

## Décision de périmètre V1 (validée par le dev, 2026-07-08)

**Socle Plane-parity uniquement** :
- Table de jointure `IssuePage` + 3 endpoints (interne app + externe API).
- UI web : section « Pages » dans le work item + modale Link/Create.
- Journalisation `attach`/`detach` en activité.

**Hors V1** (décidés explicitement) : le raccourci `/page` inline dans la description (bloc Tiptap), et le back-link bidirectionnel sur la page. Voir « Réconciliation ».

## Règles métier

1. **Intra-workspace strict.** Une page ne peut être liée qu'à un work item du **même workspace** (invariant `issue.workspace == page.workspace`). Pas de lien cross-workspace (cohérent avec l'isolation Enterprise Grid).
2. **Unicité.** Un couple (work item, page) ne peut exister qu'une fois.
3. **Aucune permission stockée dans le lien.** L'autorisation est résolue dynamiquement à chaque lecture (appartenance projet/workspace → rôle → visibilité de la page). Le lien n'accorde jamais d'accès par transitivité.
4. **Autorisations des opérations** : `attach` = droit d'écriture sur le work item **et** de lecture sur la page ; `detach` = écriture sur le work item ; `list` = lecture, filtrée **page par page** selon la visibilité pour le demandeur.
5. **Traçabilité.** `attach` et `detach` émettent un événement d'activité (acteur, ids, timestamp) — la trace ne doit pas dépendre de la ligne (que `detach` supprime).
6. **CE aujourd'hui = pages projet uniquement** (les pages wiki workspace-scoped sont EE et n'existent pas en CE). Le modèle vise `Page` (pas `ProjectPage`) pour rester compatible si le wiki arrive.

## Personas / User stories

_À compléter (spec-writer)._ Pistes : un membre lie la note de spec à la tâche ; un agent MCP attache automatiquement la doc générée au work item.

## Cas limites

- Page ou work item supprimé → le lien doit disparaître (cascade / soft-delete cohérent RETRO-032).
- Page privée d'un autre utilisateur → invisible dans `list`, `attach` refusé (pas d'oracle d'existence).
- Work item d'un projet où le demandeur est GUEST → selon le RBAC projet.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/pages | docs/specs/api/pages/ | ✅ |
| api/issues | docs/specs/api/issues/ | ✅ |

## Réconciliation avec `work-item-page-embed` (déjà livré)

Le module `web/work-item-page-embed` (commande `/page` inline + carte) a été livré avant cette décision. Il n'est **pas** le mécanisme V1. Décision à acter au plan : (a) le laisser dormant (inoffensif), ou (b) le retirer, ou (c) le convertir en Phase 2 pour qu'il écrive une ligne `IssuePage` au lieu d'un `IssueLink`. **Recommandation : (c) plus tard** — en V1 on ne touche pas au `/page` existant, on livre le socle à côté.

## Critères d'acceptation

_À compléter._ Pistes : les 3 endpoints répondent avec les bons codes d'accès ; la section « Pages » affiche/lie/délie ; un `attach` puis `list` via MCP renvoie la page ; l'activité contient attach+detach.

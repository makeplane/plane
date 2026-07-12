# Tech Design — Active Cycles (vue workspace)

> Intention technique (rédigée au cadrage vague 1, avant implémentation).

## Approche pressentie

1. **Backend** : nouvel endpoint interne `GET /api/workspaces/<slug>/active-cycles/` dans `app/views/workspace/cycle.py` (à côté de `WorkspaceCyclesEndpoint`), calqué sur la logique `CycleViewSet` avec `cycle_view=current` : fenêtre `start <= now <= end`, compteurs annotés, pagination cursor. Scoping strict `ProjectMember` actif (l'endpoint workspace existant `WorkspaceCyclesEndpoint` ne scope PAS par projet — ne pas le réutiliser tel quel).
2. **Front** : remplir `ce/components/active-cycles/root.tsx` (remplace `WorkspaceActiveCyclesUpgrade`) ; la route `/:ws/active-cycles` et le service front `cycleService.workspaceActiveCycles` existent déjà (dormants).
3. Zéro migration ; aucune exposition v1/MCP (pas de ressource SDK correspondante).

## Points ouverts (tranchés à l'implémentation)

- Round-trip timezone par projet (pattern CycleViewSet) vs `timezone.now()` UTC : **UTC retenu** — équivalent sur l'instant, conversion tz uniquement en sortie pour l'affichage.
- Load-more front : **non** (une page de 100 suffit largement ; le backend pagine déjà si besoin futur).

## Risques identifiés au cadrage

- Fuite cross-projet si le scoping repose sur la seule appartenance workspace → queryset ProjectMember obligatoire.
- Exactitude des compteurs sous jointures multiplicatives → `distinct=True` partout + `.distinct()`.
- Borne `per_page` du paginator à confronter au 100 envoyé par le front.

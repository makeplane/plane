# Tech Design — Vues publiques/privées (views-access)

> Intention technique (re-cadrage vague 1, agent views-access-cadrage — journal wf_a91b9886).

## Constat du cadrage

~70 % pré-câblé en CE : `IssueView.access` existe (0=Private/1=Public, défaut Public), queryset de visibilité DÉJÀ actif (`Q(owned_by)|Q(access=1)`), formulaires web envoient déjà `access` dans le payload, composants montés. Deux verrous seulement : `access` en `read_only_fields` (le POST/PATCH le droppe silencieusement) + 2 stubs CE vides.

## Approche retenue

1. Backend : retirer `access` de `read_only_fields` (UNE ligne) — les gardes préexistantes (owner-only, queryset) suffisent.
2. Web : remplir `access-controller.tsx` (réutiliser `AccessField` upstream) et `filters/access-filter.tsx` (pattern facette voisine).
3. Zéro migration ; « Shared » explicitement hors scope (net-new : migration + table de partage) ; `is_locked` sans write path (sous-feature à part) ; stubs layouts (`helper.tsx`) = feature distincte, non traitée ici.

## Risques identifiés

- Rendre `access` inscriptible ouvre la bascule public→privé par PATCH : couvert par la garde owner-only préexistante (testée).
- Validation des valeurs : déléguée au ChoiceField DRF dérivé du modèle (testé).

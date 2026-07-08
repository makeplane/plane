# Spec Technique — Commande /page & bloc-page dans un work item

| Champ      | Valeur                     |
|------------|-----------------------------|
| Module     | web/work-item-page-embed   |
| Version    | 0.1.0                      |
| Date       | 2026-07-08                 |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-08, Phase 1) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro/Business de Plane (embed de pages), réimplémentée en CE (AGPL, aucun code plane-ee).

---

## Objectif

Commande slash `/page` dans la description d'un work item : crée une page projet, insère un bloc-page cliquable (façon Notion) dans la description, et ajoute un lien retour vers la page sur le work item.

## Architecture

Nouveau nœud Tiptap `page-embed` (block atom) dans `packages/editor`, dont la logique métier (création de page, lien) est fournie par `apps/web` via le canal `extendedEditorProps` (déjà câblé de bout en bout jusqu'à `CoreEditorExtensions` et `RichTextEditorAdditionalExtensions`).

**Décision de persistance (hors ADR — confinée au module éditeur, cf. politique 06) :** le bloc se sérialise comme un `<div data-block-type="page-embed-component" data-id data-name>` (patron du nœud *callout*). Tag `div` + attributs `data-*` déjà autorisés par le sanitizer nh3 backend (`apps/api/plane/utils/content_validator.py`) → le bloc **survit à toutes les sauvegardes de `description_html` sans aucune modification backend**. Ne PAS utiliser un tag custom `<page-embed-component>` (il serait supprimé par le sanitizer, contrairement à `mention-component` qui est explicitement whitelisté).

## Fichiers concernés

### packages/editor
| Fichier | Rôle |
|---------|------|
| `src/core/extensions/page-embed/{types,extension-config,extension,index}.ts(x)` | Nœud + NodeView (widgetCallback) |
| `src/core/constants/extension.ts` | `CORE_EXTENSIONS.PAGE_EMBED` + `BLOCK_NODE_TYPES` |
| `src/core/extensions/{extensions,core-without-props,index}.ts` | Enregistrement (édition + parsing lecture) |
| `src/core/types/editor.ts` | `TEditorCommands` += `"page-embed"` |
| `src/ce/types/editor-extended.ts` | `IEditorPropsExtended` = `{ pageEmbedWidgetCallback?, additionalSlashCommandOptions? }` |
| `src/ce/extensions/rich-text-extensions.tsx` | Forward `additionalOptions` → `SlashCommands` |

### apps/web
| Fichier | Rôle |
|---------|------|
| `core/components/editor/embeds/page-embed/card.tsx` | Carte cliquable (Link vers la page) |
| `core/components/editor/embeds/page-embed/use-issue-page-embed.tsx` | Hook : widgetCallback + option slash `/page` (createPage → setPageEmbed → createLink) |
| `core/components/editor/rich-text/editor.tsx` | Wrapper : forward `extendedEditorProps` |
| `core/components/editor/rich-text/description-input/root.tsx` | Branche la config (gardée aux descriptions d'issue) |
| `core/components/editor/document/editor.tsx` | Fix : `extendedEditorProps ?? {}` (type devenu concret) |

## API

Aucune nouvelle API. Réutilise :
- `ProjectPageService.create(workspaceSlug, projectId, { name })` — crée la page projet.
- `createLink(workspaceSlug, projectId, issueId, { title, url })` depuis le hook store `useIssueDetail(EIssueServiceType.ISSUES)` — ajoute le lien retour sur le work item.

## Schéma BDD

Aucune migration. Le bloc vit dans `description_html` / `description_binary` du work item.

## Tests

Pas d'infra de test web (pas de Vitest dans `apps/web`). Vérifié statiquement : build `@plane/editor` (tsc+tsdown), typecheck web, lint.

## Reste à faire / points ouverts

- Test runtime navigateur (création, rendu du bloc, navigation, **persistance après rechargement** = point critique sanitizer).
- V1 : page créée en « Untitled » ; `/page` uniquement sur les descriptions de work items.
- Phase 2 possible : titre à la création (prompt), panneau des pages liées, embed dans les pages elles-mêmes.

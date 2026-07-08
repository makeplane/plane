# VERSIONNING — web/work-item-page-embed

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-08 | feat | Commande slash `/page` + nœud Tiptap `page-embed` (bloc-page cliquable, persistance `div[data-block-type]` compatible sanitizer) + lien retour work item | packages/editor/src/core/extensions/page-embed/*, packages/editor/src/core/{constants/extension.ts, extensions/{extensions,core-without-props,index}.ts, types/editor.ts}, packages/editor/src/ce/{types/editor-extended.ts, extensions/rich-text-extensions.tsx}, apps/web/core/components/editor/embeds/page-embed/*, apps/web/core/components/editor/rich-text/{editor.tsx, description-input/root.tsx}, apps/web/core/components/editor/document/editor.tsx |
| 0.1.1 | 2026-07-08 | fix | Retrait d'un import `ReactNode` inutilisé (lint) | packages/editor/src/ce/types/editor-extended.ts |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.

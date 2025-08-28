import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { find } from "linkifyjs";
import type { Slice } from "@tiptap/pm/model";
// plane editor imports
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";

export const EXTERNAL_EMBED_PASTE_PLUGIN_KEY = new PluginKey("externalEmbedPastePlugin");

export const createExternalEmbedPastePlugin = (options: { isFlagged: boolean; editor: Editor }): Plugin =>
  new Plugin({
    key: EXTERNAL_EMBED_PASTE_PLUGIN_KEY,
    props: {
      handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
        const { from } = view.state.selection;
        const $from = view.state.doc.resolve(from);
        const paragraphNode = $from.node($from.depth);
        const isEmpty = paragraphNode.content.size === 0;
        let textContent = "";

        slice.content.forEach((node) => {
          textContent += node.textContent;
        });

        const { isFlagged } = options;
        const link = find(textContent).find((item) => item.isLink && item.value === textContent);

        if (link?.href && isEmpty && !isFlagged) {
          const { from, to } = view.state.selection;

          options.editor
            .chain()
            .insertExternalEmbed({
              [EExternalEmbedAttributeNames.IS_RICH_CARD]: false,
              [EExternalEmbedAttributeNames.SOURCE]: link.href,
              pos: { from, to },
            })
            .createParagraphNear()
            .run();

          return true;
        }

        return false;
      },
    },
  });

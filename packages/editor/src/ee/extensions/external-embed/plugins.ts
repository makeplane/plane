import type { Editor } from "@tiptap/core";
import type { Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { find } from "linkifyjs";
// plane editor imports
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
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
        const isWebUrl = link?.href.startsWith("http") || link?.href.startsWith("www");

        if (link?.href && isEmpty && !isFlagged && isWebUrl) {
          const urlText = link.href;
          const to = from + urlText.length;

          const storage = getExtensionStorage(options.editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
          if (storage) {
            storage.url = urlText;
            storage.isPasteDialogOpen = true;
            storage.posToInsert = { from, to };
          }
        }

        return false;
      },
    },
  });

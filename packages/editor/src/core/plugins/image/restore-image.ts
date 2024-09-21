import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// plugins
import { ImageNode } from "@/plugins/image";
// types
import { RestoreImage } from "@/types";

export const TrackImageRestorationPlugin = (editor: Editor, restoreImage: RestoreImage, nodeType: string): Plugin =>
  new Plugin({
    key: new PluginKey(`restore-${nodeType}`),
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const oldImageSources = new Set<string>();
      oldState.doc.descendants((node) => {
        if (node.type.name === nodeType) {
          oldImageSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        if (!transaction.docChanged) return;

        const addedImages: ImageNode[] = [];

        newState.doc.descendants((node, pos) => {
          if (node.type.name !== nodeType) return;
          if (pos < 0 || pos > newState.doc.content.size) return;
          if (oldImageSources.has(node.attrs.src)) return;
          addedImages.push(node as ImageNode);
        });

        addedImages.forEach(async (image) => {
          const src = image.attrs.src;
          const wasDeleted = editor.storage[nodeType].deletedImageSet.get(src);
          if (wasDeleted === undefined) {
            editor.storage[nodeType].deletedImageSet.set(src, false);
          } else if (wasDeleted === true) {
            try {
              await onNodeRestored(src, restoreImage);
              editor.storage[nodeType].deletedImageSet.set(src, false);
            } catch (error) {
              console.error("Error restoring image: ", error);
            }
          }
        });
      });
      return null;
    },
  });

async function onNodeRestored(src: string, restoreImage: RestoreImage): Promise<void> {
  try {
    if (!src) return;
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    await restoreImage(assetUrlWithWorkspaceId);
  } catch (error) {
    console.error("Error restoring image: ", error);
    throw error;
  }
}

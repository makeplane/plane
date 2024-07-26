import { Editor } from "@tiptap/core";
import { EditorState, Plugin, Transaction } from "@tiptap/pm/state";
// plugins
import { IMAGE_NODE_TYPE, ImageNode, restoreKey } from "@/plugins/image";
// types
import { RestoreImage } from "@/types";

export const TrackImageRestorationPlugin = (editor: Editor, restoreImage: RestoreImage): Plugin =>
  new Plugin({
    key: restoreKey,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const oldImageSources = new Set<string>();
      oldState.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          oldImageSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        if (!transaction.docChanged) return;

        const addedImages: ImageNode[] = [];

        newState.doc.descendants((node, pos) => {
          if (node.type.name !== IMAGE_NODE_TYPE) return;
          if (pos < 0 || pos > newState.doc.content.size) return;
          if (oldImageSources.has(node.attrs.src)) return;
          addedImages.push(node as ImageNode);
        });

        addedImages.forEach(async (image) => {
          const wasDeleted = editor.storage.image.deletedImageSet.get(image.attrs.src);
          if (wasDeleted === undefined) {
            editor.storage.image.deletedImageSet.set(image.attrs.src, false);
          } else if (wasDeleted === true) {
            try {
              await onNodeRestored(image.attrs.src, restoreImage);
              editor.storage.image.deletedImageSet.set(image.attrs.src, false);
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
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    await restoreImage(assetUrlWithWorkspaceId);
  } catch (error) {
    console.error("Error restoring image: ", error);
    throw error;
  }
}

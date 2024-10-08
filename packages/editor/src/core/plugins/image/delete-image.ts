import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// plugins
import { type ImageNode } from "@/plugins/image";
// types
import { DeleteImage } from "@/types";

export const TrackImageDeletionPlugin = (editor: Editor, deleteImage: DeleteImage, nodeType: string): Plugin =>
  new Plugin({
    key: new PluginKey(`delete-${nodeType}`),
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const newImageSources = new Set<string>();
      newState.doc.descendants((node) => {
        if (node.type.name === nodeType) {
          newImageSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        // if the transaction has meta of skipImageDeletion get to true, then return (like while clearing the editor content programatically)
        if (transaction.getMeta("skipImageDeletion")) return;
        // transaction could be a selection
        if (!transaction.docChanged) return;

        const removedImages: ImageNode[] = [];

        // iterate through all the nodes in the old state
        oldState.doc.descendants((oldNode) => {
          // if the node is not an image, then return as no point in checking
          if (oldNode.type.name !== nodeType) return;

          // Check if the node has been deleted or replaced
          if (!newImageSources.has(oldNode.attrs.src)) {
            removedImages.push(oldNode as ImageNode);
          }
        });

        removedImages.forEach(async (node) => {
          const src = node.attrs.src;
          editor.storage[nodeType].deletedImageSet.set(src, true);
          await onNodeDeleted(src, deleteImage);
        });
      });

      return null;
    },
  });

async function onNodeDeleted(src: string, deleteImage: DeleteImage): Promise<void> {
  try {
    if (!src) return;
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    await deleteImage(assetUrlWithWorkspaceId);
  } catch (error) {
    console.error("Error deleting image: ", error);
  }
}

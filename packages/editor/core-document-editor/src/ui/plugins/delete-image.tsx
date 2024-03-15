import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { DeleteImage } from "src/types/delete-image";
import { RestoreImage } from "src/types/restore-image";

const deleteKey = new PluginKey("delete-image");
const IMAGE_NODE_TYPE = "image";

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

export const TrackImageDeletionPlugin = (deleteImage: DeleteImage): Plugin =>
  new Plugin({
    key: deleteKey,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const newImageSources = new Set<string>();
      newState.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          newImageSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        if (!transaction.docChanged) return;

        const removedImages: ImageNode[] = [];

        oldState.doc.descendants((oldNode, oldPos) => {
          if (oldNode.type.name !== IMAGE_NODE_TYPE) return;
          if (oldPos < 0 || oldPos > newState.doc.content.size) return;
          if (!newState.doc.resolve(oldPos).parent) return;

          const newNode = newState.doc.nodeAt(oldPos);

          // Check if the node has been deleted or replaced
          if (!newNode || newNode.type.name !== IMAGE_NODE_TYPE) {
            if (!newImageSources.has(oldNode.attrs.src)) {
              removedImages.push(oldNode as ImageNode);
            }
          }
        });

        removedImages.forEach(async (node) => {
          const src = node.attrs.src;
          await onNodeDeleted(src, deleteImage);
        });
      });

      return null;
    },
  });

export async function onNodeDeleted(src: string, deleteImage: DeleteImage): Promise<void> {
  try {
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    const resStatus = await deleteImage(assetUrlWithWorkspaceId);
    if (resStatus === 204) {
      console.log("Image deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting image: ", error);
  }
}

export async function onNodeRestored(src: string, restoreImage: RestoreImage): Promise<void> {
  try {
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    const resStatus = await restoreImage(assetUrlWithWorkspaceId);
    if (resStatus === 204) {
      console.log("Image restored successfully");
    }
  } catch (error) {
    console.error("Error restoring image: ", error);
  }
}

import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { DeleteImage } from "../../types/delete-image";
import { validateKey } from "./validate-image";

// const deleteKey = new PluginKey("delete-image");
const IMAGE_NODE_TYPE = "image";

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

const TrackImageDeletionPlugin = (deleteImage: DeleteImage): Plugin =>
  new Plugin({
    key: new PluginKey("track-image-deletion"),
    view() {
      return {
        update: (view) => {
          console.log("view", view, "ran");
        },
      };
    },
    appendTransaction: (
      transactions: readonly Transaction[],
      oldState: EditorState,
      newState: EditorState,
    ) => {
      // const { view } = this.editor;
      const newImageSources = new Set<string>();
      newState.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          newImageSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        // transaction could be a selection
        if (!transaction.docChanged) return;

        const removedImages: ImageNode[] = [];

        // iterate through all the nodes in the old state
        oldState.doc.descendants((oldNode, oldPos) => {
          // if the node is not an image, then return as no point in checking
          if (oldNode.type.name !== IMAGE_NODE_TYPE) return;

          if (oldPos < 0 || oldPos > newState.doc.content.size) return;
          const nodeExistsInNewStateAtOldPosition =
            newState.doc.resolve(oldPos).parent;

          // when image deleted from the end of the document, then document
          // closing tag is considered as the final node
          if (!nodeExistsInNewStateAtOldPosition) return;

          const currentNodeAtOldPosition = newState.doc.nodeAt(oldPos);

          // Check if the node has been deleted or replaced
          if (
            !currentNodeAtOldPosition ||
            currentNodeAtOldPosition.type.name !== IMAGE_NODE_TYPE
          ) {
            if (!newImageSources.has(oldNode.attrs.src)) {
              removedImages.push(oldNode as ImageNode);
            }
          }
        });

        removedImages.forEach(async (node) => {
          const src = node.attrs.src;
          // await onNodeDeleted(src, deleteImage);
          const imageValidationState = validateKey.getState(newState);
          console.log("imageValidationState", imageValidationState.images);
          const plugin = validateKey.get(newState);
          // transaction.setMeta(validateKey, "deleteTheImage");
          // const tr = newState.tr.setMeta(validateKey, "deleteTheImage");
          console.log("plugin", plugin);
          // view.dispatch(tr);
          // images.delete(src);
        });
      });

      return null;
    },
  });

export default TrackImageDeletionPlugin;

async function onNodeDeleted(
  src: string,
  deleteImage: DeleteImage,
): Promise<void> {
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

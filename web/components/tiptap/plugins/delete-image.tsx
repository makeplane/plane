import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import fileService from "services/file.service";

const deleteKey = new PluginKey("delete-image");

const IMAGE_NODE_TYPE = "image";

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

const TrackImageDeletionPlugin = (): Plugin =>
  new Plugin({
    key: deleteKey,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
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
            // Check if the node still exists elsewhere in the document
            let nodeExists = false;
            newState.doc.descendants((node) => {
              if (node.attrs.src === oldNode.attrs.src) {
                nodeExists = true;
              }
            });
            if (!nodeExists) {
              removedImages.push(oldNode as ImageNode);
            }
          }
        });

        removedImages.forEach(async (node) => {
          const src = node.attrs.src;
          await onNodeDeleted(src);
        });
      });

      return null;
    },
  });

export default TrackImageDeletionPlugin;

async function onNodeDeleted(src: string): Promise<void> {
  try {
    const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
    const resStatus = await fileService.deleteImage(assetUrlWithWorkspaceId);
    if (resStatus === 204) {
      console.log("Image deleted successfully");
    }
  } catch (error) {
    console.error("Error deleting image: ", error);
  }
}

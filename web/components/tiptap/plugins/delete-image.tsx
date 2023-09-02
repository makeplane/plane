import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import fileService from "services/file.service";

const deleteKey = new PluginKey("delete-image");

const TrackImageDeletionPlugin = () =>
  new Plugin({
    key: deleteKey,
    appendTransaction: (transactions, oldState, newState) => {
      transactions.forEach((transaction) => {
        if (!transaction.docChanged) return;

        const removedImages: ProseMirrorNode[] = [];

        oldState.doc.descendants((oldNode, oldPos) => {
          if (oldNode.type.name !== 'image') return;

          if (oldPos < 0 || oldPos > newState.doc.content.size) return;
          if (!newState.doc.resolve(oldPos).parent) return;
          const newNode = newState.doc.nodeAt(oldPos);

          // Check if the node has been deleted or replaced
          if (!newNode || newNode.type.name !== 'image') {
            // Check if the node still exists elsewhere in the document
            let nodeExists = false;
            newState.doc.descendants((node) => {
              if (node.attrs.id === oldNode.attrs.id) {
                nodeExists = true;
              }
            });
            if (!nodeExists) {
              removedImages.push(oldNode as ProseMirrorNode);
            }
          }
        });

        removedImages.forEach((node) => {
          const src = node.attrs.src;
          onNodeDeleted(src);
        });
      });

      return null;
    },
  });

export default TrackImageDeletionPlugin;

async function onNodeDeleted(src: string) {
  const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
  const resStatus = await fileService.deleteImage(assetUrlWithWorkspaceId);
  if (resStatus === 204) {
    console.log("Image deleted successfully");
  }
}

import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { UploadImagesPlugin } from "src/ui/plugins/upload-image";
import ImageExt from "@tiptap/extension-image";
import { onNodeDeleted, onNodeRestored } from "src/ui/plugins/delete-image";
import { DeleteImage } from "src/types/delete-image";
import { RestoreImage } from "src/types/restore-image";

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

const deleteKey = new PluginKey("delete-image");
const IMAGE_NODE_TYPE = "image";

export const ImageExtension = (deleteImage: DeleteImage, restoreFile: RestoreImage, cancelUploadImage?: () => any) =>
  ImageExt.extend({
    addProseMirrorPlugins() {
      return [
        UploadImagesPlugin(cancelUploadImage),
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
              // transaction could be a selection
              if (!transaction.docChanged) return;

              const removedImages: ImageNode[] = [];

              // iterate through all the nodes in the old state
              oldState.doc.descendants((oldNode, oldPos) => {
                // if the node is not an image, then return as no point in checking
                if (oldNode.type.name !== IMAGE_NODE_TYPE) return;

                // Check if the node has been deleted or replaced
                if (!newImageSources.has(oldNode.attrs.src)) {
                  removedImages.push(oldNode as ImageNode);
                }
              });

              removedImages.forEach(async (node) => {
                const src = node.attrs.src;
                this.storage.images.set(src, true);
                await onNodeDeleted(src, deleteImage);
              });
            });

            return null;
          },
        }),
        new Plugin({
          key: new PluginKey("imageRestoration"),
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
                const wasDeleted = this.storage.images.get(image.attrs.src);
                if (wasDeleted === undefined) {
                  this.storage.images.set(image.attrs.src, false);
                } else if (wasDeleted === true) {
                  await onNodeRestored(image.attrs.src, restoreFile);
                }
              });
            });
            return null;
          },
        }),
      ];
    },

    onCreate(this) {
      const imageSources = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === IMAGE_NODE_TYPE) {
          imageSources.add(node.attrs.src);
        }
      });
      imageSources.forEach(async (src) => {
        try {
          const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
          await restoreFile(assetUrlWithWorkspaceId);
        } catch (error) {
          console.error("Error restoring image: ", error);
        }
      });
    },

    // storage to keep track of image states Map<src, isDeleted>
    addStorage() {
      return {
        images: new Map<string, boolean>(),
      };
    },

    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: "35%",
        },
        height: {
          default: null,
        },
      };
    },
  });

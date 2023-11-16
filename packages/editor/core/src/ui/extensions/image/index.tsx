import { imageValidationPlugin } from "../../plugins/validate-image";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { DeleteImage } from "../../../types/delete-image";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ValidateImage } from "../../../types/validate-image";
import UploadImagesPlugin from "../../plugins/upload-image";
import TrackImageDeletionPlugin from "../../plugins/delete-image";
import ImageExt from "@tiptap/extension-image";

const getSetFromOptions = (options: any) => {
  if (!options.imageSet) {
    return null;
  }
  return options.imageSet;
};

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

interface ImageState {
  images: Set<string>;
}

const deleteKey = new PluginKey("delete-image");
const IMAGE_NODE_TYPE = "image";

// async function url2blob(url: string) {
//   const img = new Image();
//   var timestamp = new Date().getTime();
//   img.setAttribute("crossOrigin", "anonymous");
//   img.src = url + "?" + timestamp;
//   console.log("image", img);
//   img.onload = function () {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
//     canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
//     ctx.drawImage(this, 0, 0);
//     const blob = canvas.toDataURL("image/png");
//     console.log("blobllllllllll", blob);
//     // Now you can save 'blob' to IndexedDB and use it later for reupload
//   };
// }

// async function getDataBlob(url) {
//   try {
//     var res = await fetch(url, {
//       headers: {
//         "Content-Type": "image/png",
//         "Sec-Fetch-Mode": "no-cors",
//       },
//     });
//     console.log("ressssss", res);
//     var blob = await res.blob();
//     var base64img = await parseURI(blob);
//     console.log(base64img);
//   } catch (error) {
//     console.log(error);
//   }
// }
//
// async function parseURI(d) {
//   var reader = new FileReader();
//   reader.readAsDataURL(d);
//   return new Promise((res, rej) => {
//     reader.onload = (e) => {
//       res(e.target.result);
//     };
//   });
// }

const ImageExtension = (
  deleteImage: DeleteImage,
  validateImage?: ValidateImage,
  cancelUploadImage?: () => any,
) =>
  ImageExt.extend({
    addProseMirrorPlugins() {
      return [
        // new Plugin({
        //   key: new PluginKey("imageValidation"),
        //   filterTransaction: (transaction, state: EditorState) => {
        //     // console.log("filter transaction", transaction, this.storage.images);
        //     // const isUndo = transaction.meta.history$?.redo === false;
        //     // console.log("isUndo", isUndo);
        //     const addedImages: ImageNode[] = transaction.steps
        //       .map((step) => step.slice)
        //       .flat()
        //       .filter((slice) => slice.content)
        //       .flatMap((slice) => slice.content.content)
        //       .filter((node) => node.type.name === "image");
        //
        //     // console.log("is undo operation", transaction.getMeta("isUndo"));
        //     let shouldLetImageRender = true;
        //     addedImages.forEach((image) => {
        //       const wasDeleted = this.storage.images.get(image.attrs.src);
        //       if (wasDeleted === undefined) {
        //         this.storage.images.set(image.attrs.src, false);
        //       } else if (wasDeleted === true) {
        //         shouldLetImageRender = false;
        //         // url2blob(image.attrs.src);
        //         // getDataBlob(image.attrs.src);
        //       }
        //     });
        //
        //     return shouldLetImageRender;
        //   },
        // }),
        UploadImagesPlugin(cancelUploadImage),
        new Plugin({
          key: deleteKey,
          appendTransaction: (
            transactions: readonly Transaction[],
            oldState: EditorState,
            newState: EditorState,
          ) => {
            // const { view } = this.editor;
            // console.log("appendTransaction", "ran");
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
                // const imageValidationState = validateKey.getState(newState);
                // console.log(
                //   "imageValidationState",
                //   imageValidationState.images,
                // );

                // console.log(
                //   "this.storage.images in delete",
                //   this.storage.images
                // );
                this.storage.images.set(src, true);

                // const plugin = validateKey.get(newState);
                // transaction.setMeta(validateKey, "deleteTheImage");
                // const tr = newState.tr.setMeta(validateKey, "deleteTheImage");
                // console.log("plugin", plugin);
                // view.dispatch(tr);
                // images.delete(src);
              });
            });

            return null;
          },
        }),
        // TrackImageDeletionPlugin(deleteImage),
        // imageValidationPlugin(validateImage),
      ];
    },

    addOptions() {
      return {
        ...this.parent?.(),
        limit: null,
        mode: "textSize",
      };
    },

    // onBeforeCreate() {
    //   this.storage.characters = (options) => {
    //     const node = options?.node || this.editor.state.doc;
    //     const mode = options?.mode || this.options.mode;
    //
    //     if (mode === "textSize") {
    //       const text = node.textBetween(0, node.content.size, undefined, " ");
    //
    //       return text.length;
    //     }
    //
    //     return node.nodeSize;
    //   };
    //
    //   this.storage.words = (options) => {
    //     const node = options?.node || this.editor.state.doc;
    //     const text = node.textBetween(0, node.content.size, " ", " ");
    //     const words = text.split(" ").filter((word) => word !== "");
    //
    //     return words.length;
    //   };
    // },

    // addStorage() {
    //   return {
    //     characters: () => 0,
    //     words: () => 0,
    //   };
    // },

    addStorage() {
      return {
        images: new Map<string, boolean>(),
      };
    },

    // addCommands() {
    //   return {
    //     setImageSet:
    //       (imageSrc: string) =>
    //       ({ dispatch, state }) => {
    //         if (dispatch && imageSrc) {
    //           state.tr.setMeta("addImageSet", imageSrc);
    //         }
    //
    //         return true;
    //       },
    //   };
    // },
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

export default ImageExtension;

import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ValidateImage } from "../../types/validate-image";

export const validateKey = new PluginKey("validate-image");

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

interface ImageState {
  images: Set<string>;
}

export const imageValidationPlugin = (validateImage?: ValidateImage): Plugin =>
  new Plugin({
    key: validateKey,
    state: {
      init: (): ImageState => {
        return { images: new Set() };
      },
      apply: (tr, prev, oldState, newState) => {
        console.log("meta data", tr.getMeta(validateKey));
        if (tr.getMeta(validateKey) === "deleteTheImage") {
          console.log("wwwwwwwww");
        }
        const addedImages: ImageNode[] = tr.steps
          .map((step) => step.slice)
          .flat()
          .filter((slice) => slice.content)
          .flatMap((slice) => slice.content.content)
          .filter((node) => node.type.name === "image");

        const images = new Set(prev.images);
        console.log("awesomeness", this?.storage?.customExtension.awesomeness);
        addedImages.forEach((image) => {
          images.add(image.attrs.src);
        });

        console.log("images", images);
        return { images };
      },
    },
    commands: {
      deleteImage: () => (state, dispatch) => {
        const { selection } = state;
        const { $from, $to } = selection;
        const node = $from.node($from.depth);
        const { src } = node.attrs;
        const tr = state.tr.deleteSelection();
        tr.setMeta(validateKey, "deleteTheImage");
        dispatch?.(tr);
        return true;
      },
    },
    filterTransaction(transaction, state) {
      console.log(
        "awesomeness in transaction",
        this?.storage?.customExtension.awesomeness,
      );
      // const addedImages: ImageNode[] = transaction.steps
      //   .map((step) => step.slice)
      //   .flat()
      //   .filter((slice) => slice.content)
      //   .flatMap((slice) => slice.content.content)
      //   .filter((node) => node.type.name === "image");

      const imageState: ImageState = validateKey.getState(state);

      console.log("imageState", imageState);
      // If there are any image nodes, allow the transaction to pass
      // for (const image of addedImages) {
      //   if (imageState.images.has(image.attrs.src)) {
      //     return false;
      //   }
      // }

      // Otherwise, ignore the transaction
      return true;
    },
  });

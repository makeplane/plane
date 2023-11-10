import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ValidateImage } from "../../types/validate-image";

const validateKey = new PluginKey("validate-image");

interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

export const imageValidationPlugin = (validateImage?: ValidateImage): Plugin =>
  new Plugin({
    key: validateKey,
    filterTransaction(transaction) {
      // Check if any new image nodes have been added
      console.log("transaction");
      const addedImages = transaction.steps
        .map((step) => step.slice)
        .flat()
        .filter((slice) => slice.content)
        .flatMap((slice) => slice.content.content)
        .filter((node) => node.type.name === "image");

      // If there are any image nodes, allow the transaction to pass
      console.log(addedImages);
      // if (addedImages.length > 0) {
      //   return false;
      // }

      // Otherwise, ignore the transaction
      return true;
    },
  });

import { Extension } from "@tiptap/core";
// plane imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { BlockMathExtension } from "./block-math/extension";
import { InlineMathExtension } from "./inline-math/extension";
// types
import { MathematicsExtensionOptions, MathematicsExtensionStorage } from "./types";

export const MathematicsExtensionConfig = Extension.create<MathematicsExtensionOptions, MathematicsExtensionStorage>({
  name: ADDITIONAL_EXTENSIONS.MATHEMATICS,

  addOptions() {
    return {
      isFlagged: false,
      onClick: undefined,
    };
  },

  addStorage() {
    return {
      openMathModal: false,
    };
  },

  addExtensions() {
    return [
      BlockMathExtension.configure({
        isFlagged: this.options.isFlagged,
        onClick: this.options.onClick,
      }),
      InlineMathExtension.configure({
        isFlagged: this.options.isFlagged,
        onClick: this.options.onClick,
      }),
    ];
  },
});

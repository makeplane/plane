import { Extensions } from "@tiptap/core";
// ce imports
import { TCoreAdditionalExtensionsProps } from "src/ce/extensions";
import { MathematicsExtension } from "@/plane-editor/extensions/mathematics";

export const CoreEditorAdditionalExtensions = (props: TCoreAdditionalExtensionsProps): Extensions => {
  const { flaggedExtensions } = props;
  const extensions: Extensions = [];
  extensions.push(MathematicsExtension({ isFlagged: !!flaggedExtensions?.includes("mathematics") }));
  return extensions;
};

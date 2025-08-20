import { Extensions } from "@tiptap/core";
// ce imports
import type { TCoreAdditionalExtensionsProps } from "src/ce/extensions";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { MathematicsExtension } from "@/plane-editor/extensions/mathematics";
import type { IEditorPropsExtended } from "@/plane-editor/types/editor-extended";

type Props = TCoreAdditionalExtensionsProps & Pick<IEditorPropsExtended, "extensionOptions">;

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const { flaggedExtensions, extensionOptions } = props;
  const extensions: Extensions = [];
  extensions.push(
    MathematicsExtension({
      isFlagged: !!flaggedExtensions?.includes("mathematics"),
      ...extensionOptions?.[ADDITIONAL_EXTENSIONS.MATHEMATICS],
    })
  );
  return extensions;
};

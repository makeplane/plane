import { Extensions } from "@tiptap/core";
// ce imports
import type { TCoreAdditionalExtensionsProps } from "src/ce/extensions";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import type { IEditorPropsExtended } from "@/plane-editor/types/editor-extended";
// types
import type { TExternalEmbedConfig } from "@/types";
// local imports
import { ExternalEmbedExtension } from "../external-embed/extension";
import { MathematicsExtension } from "../mathematics/extension";

type Props = TCoreAdditionalExtensionsProps & Pick<IEditorPropsExtended, "embedHandler" | "extensionOptions">;

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const { flaggedExtensions, extensionOptions, disabledExtensions } = props;
  const extensions: Extensions = [];
  extensions.push(
    MathematicsExtension({
      isFlagged: !!flaggedExtensions?.includes("mathematics"),
      ...extensionOptions?.[ADDITIONAL_EXTENSIONS.MATHEMATICS],
    })
  );
  const widgetCallback: TExternalEmbedConfig["widgetCallback"] =
    props.embedHandler?.externalEmbedComponent?.widgetCallback ?? (() => null);
  if (!disabledExtensions?.includes("external-embed")) {
    extensions.push(
      ExternalEmbedExtension({ isFlagged: !!flaggedExtensions?.includes("external-embed"), widgetCallback })
    );
  }
  return extensions;
};

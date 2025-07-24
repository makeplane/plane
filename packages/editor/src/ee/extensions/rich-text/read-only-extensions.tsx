import { AnyExtension, Extensions } from "@tiptap/core";
// core imports
import {
  TRichTextReadOnlyEditorAdditionalExtensionsProps,
  TRichTextReadOnlyEditorAdditionalExtensionsRegistry,
} from "src/ce/extensions/rich-text/read-only-extensions";
// local imports
import { CustomAttachmentExtension } from "../attachments/extension";

const extensionRegistry: TRichTextReadOnlyEditorAdditionalExtensionsRegistry[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("attachments"),
    getExtension: ({ fileHandler, flaggedExtensions }) =>
      CustomAttachmentExtension({
        fileHandler,
        isFlagged: flaggedExtensions.includes("attachments"),
        isEditable: false,
      }),
  },
];

export const RichTextReadOnlyEditorAdditionalExtensions = (props: TRichTextReadOnlyEditorAdditionalExtensionsProps) => {
  const { disabledExtensions } = props;

  const extensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return extensions;
};

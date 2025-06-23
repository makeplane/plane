import { AnyExtension, Extensions } from "@tiptap/core";
// types
import { IReadOnlyEditorProps, TExtensions } from "@/types";

export type TRichTextReadOnlyEditorAdditionalExtensionsProps = Pick<
  IReadOnlyEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "fileHandler"
>;

/**
 * Registry entry configuration for extensions
 */
export type TRichTextReadOnlyEditorAdditionalExtensionsRegistry = {
  /** Determines if the extension should be enabled based on disabled extensions */
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  /** Returns the extension instance(s) when enabled */
  getExtension: (props: TRichTextReadOnlyEditorAdditionalExtensionsProps) => AnyExtension | undefined;
};

const extensionRegistry: TRichTextReadOnlyEditorAdditionalExtensionsRegistry[] = [];

export const RichTextReadOnlyEditorAdditionalExtensions = (props: TRichTextReadOnlyEditorAdditionalExtensionsProps) => {
  const { disabledExtensions } = props;

  const extensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return extensions;
};

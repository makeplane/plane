import { AnyExtension, Extensions } from "@tiptap/core";
// extensions
import { SlashCommands } from "@/extensions/slash-commands/root";
// types
import { TExtensions, TFileHandler } from "@/types";

export type TRichTextEditorAdditionalExtensionsProps = {
  disabledExtensions: TExtensions[];
  fileHandler: TFileHandler;
};

/**
 * Registry entry configuration for extensions
 */
export type TRichTextEditorAdditionalExtensionsRegistry = {
  /** Determines if the extension should be enabled based on disabled extensions */
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  /** Returns the extension instance(s) when enabled */
  getExtension: (props: TRichTextEditorAdditionalExtensionsProps) => AnyExtension | undefined;
};

const extensionRegistry: TRichTextEditorAdditionalExtensionsRegistry[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: ({ disabledExtensions }) =>
      SlashCommands({
        disabledExtensions,
      }),
  },
];

export const RichTextEditorAdditionalExtensions = (props: TRichTextEditorAdditionalExtensionsProps) => {
  const { disabledExtensions } = props;

  const extensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return extensions;
};

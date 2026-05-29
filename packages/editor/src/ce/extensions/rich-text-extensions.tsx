import type { AnyExtension, Extensions } from "@tiptap/core";
// extensions
import { SlashCommands } from "@/extensions/slash-commands/root";
// types
import type { IEditorProps, TExtensions } from "@/types";

export type TRichTextEditorAdditionalExtensionsProps = Pick<
  IEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "fileHandler" | "extendedEditorProps"
>;

/**
 * Registry entry configuration for extensions
 */
export type TRichTextEditorAdditionalExtensionsRegistry = {
  /** Determines if the extension should be enabled based on disabled extensions */
  isEnabled: (disabledExtensions: TExtensions[], flaggedExtensions: TExtensions[]) => boolean;
  /** Returns the extension instance(s) when enabled */
  getExtension: (props: TRichTextEditorAdditionalExtensionsProps) => AnyExtension | undefined;
};

const extensionRegistry: TRichTextEditorAdditionalExtensionsRegistry[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: ({ disabledExtensions, flaggedExtensions }) =>
      SlashCommands({
        disabledExtensions,
        flaggedExtensions,
      }),
  },
];

export function RichTextEditorAdditionalExtensions(props: TRichTextEditorAdditionalExtensionsProps) {
  const { disabledExtensions, flaggedExtensions } = props;

  const extensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions, flaggedExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return extensions;
}

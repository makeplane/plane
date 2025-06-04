import { HocuspocusProvider } from "@hocuspocus/provider";
import { AnyExtension, Extensions } from "@tiptap/core";
import { SlashCommands } from "@/extensions";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions, TFileHandler, TUserDetails } from "@/types";

export type TDocumentEditorAdditionalExtensionsProps = {
  disabledExtensions: TExtensions[];
  embedConfig: TEmbedConfig | undefined;
  fileHandler: TFileHandler;
  provider?: HocuspocusProvider;
  userDetails: TUserDetails;
};

export type TDocumentEditorAdditionalExtensionsRegistry = {
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  getExtension: (props: TDocumentEditorAdditionalExtensionsProps) => AnyExtension | undefined;
};

const extensionRegistry: TDocumentEditorAdditionalExtensionsRegistry[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: ({ disabledExtensions }) => SlashCommands({ disabledExtensions }),
  },
];

export const DocumentEditorAdditionalExtensions = (props: TDocumentEditorAdditionalExtensionsProps) => {
  const { disabledExtensions = [] } = props;

  const documentExtensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return documentExtensions;
};

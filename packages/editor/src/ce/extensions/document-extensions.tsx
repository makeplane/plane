import { HocuspocusProvider } from "@hocuspocus/provider";
import { AnyExtension } from "@tiptap/core";
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

type ExtensionConfig = {
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  getExtension: (props: TDocumentEditorAdditionalExtensionsProps) => AnyExtension;
};

const extensionRegistry: ExtensionConfig[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: ({ disabledExtensions }) => SlashCommands({ disabledExtensions }),
  },
];

export const DocumentEditorAdditionalExtensions = (_props: TDocumentEditorAdditionalExtensionsProps) => {
  const { disabledExtensions = [] } = _props;

  const documentExtensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(_props));

  return documentExtensions;
};

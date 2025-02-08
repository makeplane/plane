import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import { AnyExtension } from "@tiptap/core";
import { SlashCommands } from "@/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions, TUserDetails } from "@/types";

type Props = {
  disabledExtensions?: TExtensions[];
  issueEmbedConfig: TIssueEmbedConfig | undefined;
  provider: HocuspocusProvider;
  userDetails: TUserDetails;
};

type ExtensionConfig = {
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  getExtension: (props: Props) => AnyExtension;
};

const extensionRegistry: ExtensionConfig[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: () => SlashCommands({}),
  },
];

export const DocumentEditorAdditionalExtensions = (_props: Props) => {
  const { disabledExtensions = [] } = _props;

  const documentExtensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(_props));

  return documentExtensions;
};

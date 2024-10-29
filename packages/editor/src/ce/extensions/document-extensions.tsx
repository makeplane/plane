import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import { SlashCommands } from "@/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions, TUserDetails } from "@/types";

type Props = {
  slashCommandEnabled?: boolean;
  disabledExtensions?: TExtensions[];
  issueEmbedConfig: TIssueEmbedConfig | undefined;
  provider: HocuspocusProvider;
  userDetails: TUserDetails;
};

export const DocumentEditorAdditionalExtensions = (_props: Props) => {
  const { slashCommandEnabled } = _props;
  const extensions: Extensions = slashCommandEnabled ? [SlashCommands()] : [];

  return extensions;
};

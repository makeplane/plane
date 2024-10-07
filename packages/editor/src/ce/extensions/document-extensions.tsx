import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import { SlashCommand } from "@/extensions";
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

export const DocumentEditorAdditionalExtensions = (_props: Props) => {
  const extensions: Extensions = [SlashCommand()];

  return extensions;
};

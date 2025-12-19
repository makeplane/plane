import type { Extensions } from "@tiptap/core";
// extensions
import { WorkItemEmbedExtension } from "@/extensions";
// types
import type { TIssueEmbedConfig } from "@/plane-editor/types";
import type { IEditorProps } from "@/types";

export type TCoreAdditionalExtensionsProps = Pick<
  IEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "fileHandler" | "extendedEditorProps"
>;

export const CoreEditorAdditionalExtensions = (props: TCoreAdditionalExtensionsProps): Extensions => {
  const { extendedEditorProps } = props;
  const extensions: Extensions = [];

  // Always enable issue-embed extension if widgetCallback is provided (ignore disabledExtensions)
  type TExtendedPropsWithIssueEmbed = {
    embed?: { issue?: { widgetCallback?: TIssueEmbedConfig["widgetCallback"] } };
  };

  const issueConfig = (extendedEditorProps as TExtendedPropsWithIssueEmbed | undefined)?.embed?.issue;
  const widgetCallback = issueConfig?.widgetCallback;

  if (typeof widgetCallback === "function") {
    extensions.push(WorkItemEmbedExtension({ widgetCallback }));
  }

  return extensions;
};
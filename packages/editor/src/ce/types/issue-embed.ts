import { NodeViewProps } from "@tiptap/react";

export type TEmbedConfig = {
  issue?: TIssueEmbedConfig;
  externalEmbedComponent?: TExternalEmbedConfig;
};

export type TExternalEmbedConfig = { widgetCallback: (props: NodeViewProps) => React.ReactNode };

export type TReadOnlyEmbedConfig = TEmbedConfig;

export type TIssueEmbedConfig = {
  widgetCallback: ({
    issueId,
    projectId,
    workspaceSlug,
  }: {
    issueId: string;
    projectId: string | undefined;
    workspaceSlug: string | undefined;
  }) => React.ReactNode;
};

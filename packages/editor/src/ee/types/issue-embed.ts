export type TEmbedConfig = {
  issue?: TIssueEmbedConfig;
};

export type TReadOnlyEmbedConfig = {
  issue?: Omit<TIssueEmbedConfig, "searchCallback">;
};

export type TIssueEmbedConfig = {
  searchCallback: (searchQuery: string) => Promise<TEmbedItem[]>;
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

export type TEmbedItem = {
  id: string;
  title: string;
  subTitle: string;
  icon: React.ReactNode;
  projectId: string;
  workspaceSlug: string;
};

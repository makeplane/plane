export interface IEmbedConfig {
  issueEmbedConfig: IIssueEmbedConfig;
}

export interface IIssueEmbedConfig {
  fetchIssue: (issueId: string) => any;
  clickAction: (issueId: string, issueTitle: string) => void;
  issues: Array<any>;
}

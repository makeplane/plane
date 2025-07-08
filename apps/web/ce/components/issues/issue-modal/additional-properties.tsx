type TIssueAdditionalPropertiesProps = {
  issueId: string | undefined;
  issueTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isDraft?: boolean;
};

export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = () => <></>;

import { TIssueServiceType } from "@plane/types";

export type TIssueAdditionalPropertyValuesUpdateProps = {
  issueId: string;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
  isDisabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAdditionalPropertyValuesUpdate: React.FC<TIssueAdditionalPropertyValuesUpdateProps> = () => <></>;

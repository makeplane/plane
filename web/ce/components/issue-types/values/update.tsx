import { EWorkItemTypeEntity } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";

export type TIssueAdditionalPropertyValuesUpdateProps = {
  issueId: string;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
  isDisabled: boolean;
  issueServiceType?: TIssueServiceType;
  entityType?: EWorkItemTypeEntity;
};

export const IssueAdditionalPropertyValuesUpdate: React.FC<TIssueAdditionalPropertyValuesUpdateProps> = () => <></>;

import { EWorkItemTypeEntity } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";

export type TIssueAdditionalPropertiesProps = {
  issueId: string | undefined;
  issueTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  entityType?: EWorkItemTypeEntity;
  isDraft?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = () => <></>;

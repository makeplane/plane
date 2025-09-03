import { IIssueDisplayProperties, TIssue } from "@plane/types";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export const WorkItemLayoutAdditionalProperties: React.FC<TWorkItemLayoutAdditionalProperties> = () => <></>;

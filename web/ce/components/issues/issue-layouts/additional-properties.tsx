import React, { FC } from "react";
import { IIssueDisplayProperties, TIssue } from "@plane/types";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export const WorkItemLayoutAdditionalProperties: FC<TWorkItemLayoutAdditionalProperties> = (props) => <></>;

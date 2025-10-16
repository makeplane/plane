import type { FC } from "react";
import React from "react";
import type { IIssueDisplayProperties, TIssue } from "@plane/types";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export const WorkItemLayoutAdditionalProperties: FC<TWorkItemLayoutAdditionalProperties> = (props) => <></>;

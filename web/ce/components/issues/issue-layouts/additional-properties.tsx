import React, { FC } from "react";
import { IIssueDisplayProperties, TIssue } from "@plane/types";

export type TIssueAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

export const IssueAdditionalProperties: FC<TIssueAdditionalProperties> = (props) => <></>;

import React, { useRef } from "react";
// components
import { IIssue } from "@/types/issue";
import { CalendarIssueBlock } from "./issue-block";
// types

type Props = {
  getIssueById: (issueId: string) => IIssue | undefined;
  issueId: string;
};

export const CalendarIssueBlockRoot: React.FC<Props> = (props) => {
  const { getIssueById, issueId } = props;

  const issueRef = useRef<HTMLAnchorElement | null>(null);

  const issue = getIssueById(issueId);

  if (!issue) return null;

  return <CalendarIssueBlock issue={issue} ref={issueRef} />;
};

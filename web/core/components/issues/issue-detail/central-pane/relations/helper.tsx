"use client";
import { CircleDot, CopyPlus, XCircle } from "lucide-react";
import { TIssue } from "@plane/types";
import { RelatedIcon } from "@plane/ui";

export const ISSUE_RELATION_OPTIONS = [
  {
    key: "blocked_by",
    label: "Blocked by",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
  },
  {
    key: "blocking",
    label: "Blocking",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
  },
  {
    key: "relates_to",
    label: "Relates to",
    icon: (size: number) => <RelatedIcon height={size} width={size} />,
    className: "bg-custom-background-80 text-custom-text-200",
  },
  {
    key: "duplicate",
    label: "Duplicate of",
    icon: (size: number) => <CopyPlus size={size} />,
    className: "bg-custom-background-80 text-custom-text-200",
  },
];

export type TRelationIssueOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

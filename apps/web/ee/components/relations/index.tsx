import { useParams } from "next/navigation";
import { CircleDot, CopyPlus, XCircle } from "lucide-react";
// Plane
import { RelatedIcon } from "@plane/ui";
import { ISSUE_RELATION_OPTIONS as CE_ISSUE_RELATION_OPTIONS } from "@/ce/components/relations";
// components
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
// Plane-web
import { useFlag } from "@/plane-web/hooks/store";
import { TIssueRelationTypes } from "@/plane-web/types";

export * from "./activity";

export const ISSUE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject } = {
  relates_to: {
    key: "relates_to",
    i18n_label: "issue.relation.relates_to",
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <RelatedIcon height={size} width={size} className="text-custom-text-200" />,
    placeholder: "Add related work items",
  },
  duplicate: {
    key: "duplicate",
    i18n_label: "issue.relation.duplicate",
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <CopyPlus size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
  blocked_by: {
    key: "blocked_by",
    i18n_label: "issue.relation.blocked_by",
    className: "bg-red-500/20 text-red-700",
    icon: (size) => <CircleDot size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
  blocking: {
    key: "blocking",
    i18n_label: "issue.relation.blocking",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
  start_before: {
    key: "start_before",
    i18n_label: "issue.relation.start_before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
    placeholder: "None",
  },
  start_after: {
    key: "start_after",
    i18n_label: "issue.relation.start_after",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
  finish_before: {
    key: "finish_before",
    i18n_label: "issue.relation.finish_before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
    placeholder: "None",
  },
  finish_after: {
    key: "finish_after",
    i18n_label: "issue.relation.finish_after",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
};

export const useTimeLineRelationOptions = () => {
  const { workspaceSlug } = useParams();

  const isDependencyEnabled = useFlag(workspaceSlug.toString(), "TIMELINE_DEPENDENCY");

  return isDependencyEnabled
    ? ISSUE_RELATION_OPTIONS
    : {
        ...CE_ISSUE_RELATION_OPTIONS,
        start_before: undefined,
        start_after: undefined,
        finish_before: undefined,
        finish_after: undefined,
      };
};

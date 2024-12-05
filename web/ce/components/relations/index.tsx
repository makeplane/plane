import { CircleDot, CopyPlus, XCircle } from "lucide-react";
import { RelatedIcon } from "@plane/ui";
import { TRelationObject } from "@/components/issues";
import { TIssueRelationTypes } from "../../types";

export * from "./activity";

export const ISSUE_RELATION_OPTIONS: Record<TIssueRelationTypes, TRelationObject> = {
  relates_to: {
    key: "relates_to",
    label: "Relates to",
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <RelatedIcon height={size} width={size} className="text-custom-text-200" />,
    placeholder: "Add related issues",
  },
  duplicate: {
    key: "duplicate",
    label: "Duplicate of",
    className: "bg-custom-background-80 text-custom-text-200",
    icon: (size) => <CopyPlus size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
  blocked_by: {
    key: "blocked_by",
    label: "Blocked by",
    className: "bg-red-500/20 text-red-700",
    icon: (size) => <CircleDot size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
  blocking: {
    key: "blocking",
    label: "Blocking",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} className="text-custom-text-200" />,
    placeholder: "None",
  },
};

export const useTimeLineRelationOptions = () => ISSUE_RELATION_OPTIONS;

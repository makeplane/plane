import { CircleDot, CopyPlus, XCircle } from "lucide-react";
// Plane
import { RelatedIcon } from "@plane/ui";
// components
import { TRelationObject } from "@/components/issues";
// Plane-web
import { TIssueRelationTypes } from "@/plane-web/types";

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
  start_before: {
    key: "start_before",
    label: "Starts Before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
    placeholder: "None",
  },
  start_after: {
    key: "start_after",
    label: "Starts After",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
  finish_before: {
    key: "finish_before",
    label: "Finishes Before",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
    placeholder: "None",
  },
  finish_after: {
    key: "finish_after",
    label: "Finishes After",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
    placeholder: "None",
  },
};

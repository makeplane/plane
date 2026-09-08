/**
 * Questimus fork change (Phase 3): compact issue-type badge (name + colored
 * dot). Rendered next to the issue key wherever the type is known — list
 * rows, boards, relations, preview cards, detail/peek headers (§5.4
 * planning model: Plan/Subplan/Task/Subtask/Ticket/Design).
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useProjectIssueTypes } from "@/hooks/use-project-issue-types";

const TYPE_LEVEL_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

export type TIssueTypeBadgeProps = {
  typeId: string | null | undefined;
  projectId: string;
  size?: "xs" | "sm" | "md";
};

export const IssueTypeBadge = observer(function IssueTypeBadge({ typeId, projectId, size = "sm" }: TIssueTypeBadgeProps) {
  const { workspaceSlug } = useParams();
  const types = useProjectIssueTypes(workspaceSlug?.toString(), projectId);
  const type = types.find((t) => t.id === typeId);
  if (!type) return null;

  const color = TYPE_LEVEL_COLORS[type.level % TYPE_LEVEL_COLORS.length] ?? TYPE_LEVEL_COLORS[0];
  const textSize = size === "md" ? "text-xs" : size === "xs" ? "text-[10px]" : "text-[11px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-custom-border-200 bg-custom-background-90 px-2 py-0.5 font-medium ${textSize} text-custom-text-200`}
    >
      <span className={`size-1.5 rounded-full ${color}`} />
      {type.name}
    </span>
  );
});

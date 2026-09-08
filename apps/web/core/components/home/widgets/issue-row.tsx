/**
 * Questimus fork change (Phase 3): compact issue row for the home dashboard
 * sections — priority, zero-padded key, name, due date; click opens the issue.
 */

// plane imports
import { PriorityIcon } from "@plane/propel/icons";
import { renderFormattedDate } from "@plane/utils";
// helpers
import { getIssueKey } from "@/helpers/issue-key.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// types
import type { THomeIssue } from "./use-home-issues";

type Props = {
  issue: THomeIssue;
  workspaceSlug: string;
};

export const HomeIssueRow = ({ issue, workspaceSlug }: Props) => {
  const router = useAppRouter();
  const { getProjectIdentifierById } = useProject();
  const identifier = getProjectIdentifierById(issue.project_id);

  return (
    <button
      type="button"
      onClick={() => router.push(`/${workspaceSlug}/browse/${identifier}-${issue.sequence_id}`)}
      className="group flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left hover:bg-layer-transparent-hover"
    >
      <PriorityIcon priority={issue.priority ?? "none"} size={12} className="flex-shrink-0" />
      {identifier && (
        <span className="flex-shrink-0 text-body-xs font-medium text-secondary">
          {getIssueKey(identifier, issue.sequence_id)}
        </span>
      )}
      <span className="flex-grow truncate text-body-sm text-primary group-hover:text-primary">{issue.name}</span>
      {issue.target_date && (
        <span className="flex-shrink-0 text-body-xs text-secondary">{renderFormattedDate(issue.target_date)}</span>
      )}
    </button>
  );
};

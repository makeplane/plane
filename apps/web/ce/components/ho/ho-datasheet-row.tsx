import type { THoIssue } from "@/plane-web/services/ho-issue.service";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.store";
import { getProgressStatus } from "../issues/issue-layouts/progress-tracking-utils";
import { renderFormattedDate } from "@plane/utils";

/** Format total_log_time in minutes to "Xh Ym". */
function formatLogTime(minutes: number): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type Props = {
  issue: THoIssue;
  displayProperties: THoDisplayProperties;
  isNewDeptGroup: boolean;
  isNewProjectGroup: boolean;
};

const CELL = "border-b-[0.5px] border-subtle px-4 py-3 text-13 text-primary align-top";

export function HoDatasheetRow({ issue, displayProperties, isNewDeptGroup, isNewProjectGroup }: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";
  const progress = getProgressStatus(issue.target_date);

  return (
    <tr className={`${rowBorder} odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors`}>
      {displayProperties.department_name && <td className={`${CELL} min-w-[140px]`}>{issue.department_name || "—"}</td>}
      {displayProperties.project_name && <td className={`${CELL} min-w-[140px]`}>{issue.project_name || "—"}</td>}
      {displayProperties.main_task_category && (
        <td className={`${CELL} min-w-[140px]`}>{issue.main_task_category_name || "—"}</td>
      )}
      {displayProperties.sub_task_category && (
        <td className={`${CELL} min-w-[140px]`}>{issue.sub_task_category_name || "—"}</td>
      )}

      {/* Work Items — always visible, positioned between Sub Task Category and Sub Items */}
      <td className={`${CELL} min-w-[280px] max-w-[340px]`}>
        <a
          href={`/${issue.workspace_slug}/projects/${issue.project_id}/issues/${issue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-primary hover:underline line-clamp-2"
        >
          {issue.name}
        </a>
      </td>

      {displayProperties.sub_issue_count && (
        <td className={`${CELL} min-w-[80px] text-right`}>{issue.sub_issues_count}</td>
      )}
      {displayProperties.project_lead && <td className={`${CELL} min-w-[120px]`}>{issue.project_lead || "—"}</td>}
      {displayProperties.assignee && (
        <td className={`${CELL} min-w-[140px]`}>
          {issue.assignees.length === 0
            ? "—"
            : issue.assignees
                .slice(0, 3)
                .map((a) => a.display_name)
                .join(", ") + (issue.assignees.length > 3 ? ` +${issue.assignees.length - 3}` : "")}
        </td>
      )}
      {displayProperties.bank_wide_project && (
        <td className={`${CELL} min-w-[80px]`}>{issue.is_bank_wide_project ? "Yes" : "No"}</td>
      )}
      {displayProperties.priority && <td className={`${CELL} min-w-[80px] capitalize`}>{issue.priority || "—"}</td>}
      {displayProperties.state && (
        <td className={`${CELL} min-w-[100px]`}>
          <span className="flex items-center gap-1">
            {issue.state_color && (
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: issue.state_color }} />
            )}
            {issue.state_name || "—"}
          </span>
        </td>
      )}
      {displayProperties.progress_tracking && (
        <td className={`${CELL} min-w-[100px]`}>
          <span className={progress?.className ?? "text-secondary"}>{progress?.label ?? "—"}</span>
        </td>
      )}
      {displayProperties.modules && (
        <td className={`${CELL} min-w-[120px]`}>{issue.module_names.length ? issue.module_names.join(", ") : "—"}</td>
      )}
      {displayProperties.cycle && <td className={`${CELL} min-w-[100px]`}>{issue.cycle_name || "—"}</td>}
      {displayProperties.start_date && (
        <td className={`${CELL} min-w-[100px]`}>{issue.start_date ? renderFormattedDate(issue.start_date) : "—"}</td>
      )}
      {displayProperties.due_date && (
        <td className={`${CELL} min-w-[100px]`}>{issue.target_date ? renderFormattedDate(issue.target_date) : "—"}</td>
      )}
      {displayProperties.completed_date && (
        <td className={`${CELL} min-w-[100px]`}>
          {issue.completed_at ? renderFormattedDate(issue.completed_at) : "—"}
        </td>
      )}
      {displayProperties.total_log_time && (
        <td className={`${CELL} min-w-[80px] text-right`}>{formatLogTime(issue.total_log_time)}</td>
      )}
      {displayProperties.reference_link && (
        <td className={`${CELL} min-w-[80px] text-right`}>
          {issue.reference_link_count > 0 ? issue.reference_link_count : "—"}
        </td>
      )}
    </tr>
  );
}

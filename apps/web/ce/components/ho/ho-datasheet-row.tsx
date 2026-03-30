import type { THoIssue } from "@/plane-web/services/ho-issue.service";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.defaults";
import { getProgressStatus } from "../issues/issue-layouts/progress-tracking-utils";
import { renderFormattedDate, cn } from "@plane/utils";

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
  rowIndex: number;
  issue: THoIssue;
  displayProperties: THoDisplayProperties;
  isNewDeptGroup: boolean;
  isNewProjectGroup: boolean;
};

const CELL = "border-b-[0.5px] border-subtle px-4 py-3 text-13 text-primary align-top";

export function HoDatasheetRow({ rowIndex, issue, displayProperties, isNewDeptGroup, isNewProjectGroup }: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";
  const progress = getProgressStatus(issue.target_date);

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  // Ordered list of keys as defined in header
  const ALL_KEYS = [
    "department_name",
    "project_name",
    "main_task_category",
    "sub_task_category",
    "name",
    "sub_issue_count",
    "project_lead",
    "assignee",
    "bank_wide_project",
    "priority",
    "state",
    "progress_tracking",
    "modules",
    "cycle",
    "start_date",
    "due_date",
    "completed_date",
    "total_log_time",
    "reference_link",
  ];

  const firstVisibleKey = ALL_KEYS.find((key) => key === "name" || displayProperties[key] !== false);

  const renderTd = (
    key: string,
    content: React.ReactNode,
    minWidth?: string,
    maxWidth?: string,
    textAlign?: string
  ) => {
    const isFirst = key === firstVisibleKey;
    return (
      <td
        className={cn(
          CELL,
          minWidth,
          maxWidth,
          textAlign,
          isFirst && "sticky left-0 z-[5] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]",
          isFirst && frozenBg
        )}
      >
        {content}
      </td>
    );
  };

  return (
    <tr
      className={cn(
        rowBorder,
        "odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors group",
        // Force zebra row backgrounds even on hover for the frozen column if needed,
        // but usually hover:bg-layer-2/50 on tr works if td is bg-inherit.
        // Since we used explicit frozenBg, we need to handle hover for the frozen cell too.
        "hover:[&>td.sticky]:bg-layer-2"
      )}
    >
      {displayProperties.department_name && renderTd("department_name", issue.department_name || "—", "min-w-[140px]")}
      {displayProperties.project_name && renderTd("project_name", issue.project_name || "—", "min-w-[140px]")}
      {displayProperties.main_task_category &&
        renderTd("main_task_category", issue.main_task_category_name || "—", "min-w-[140px]")}
      {displayProperties.sub_task_category &&
        renderTd("sub_task_category", issue.sub_task_category_name || "—", "min-w-[140px]")}

      {/* Work Items — always visible */}
      {renderTd(
        "name",
        <a
          href={`/${issue.workspace_slug}/projects/${issue.project_id}/issues/${issue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-primary hover:underline line-clamp-2"
        >
          {issue.name}
        </a>,
        "min-w-[280px]",
        "max-w-[340px]"
      )}

      {displayProperties.sub_issue_count &&
        renderTd("sub_issue_count", issue.sub_issues_count, "min-w-[80px]", undefined, "text-right")}
      {displayProperties.project_lead && renderTd("project_lead", issue.project_lead || "—", "min-w-[120px]")}
      {displayProperties.assignee &&
        renderTd(
          "assignee",
          issue.assignees.length === 0
            ? "—"
            : issue.assignees
                .slice(0, 3)
                .map((a) => a.display_name)
                .join(", ") + (issue.assignees.length > 3 ? ` +${issue.assignees.length - 3}` : ""),
          "min-w-[140px]"
        )}
      {displayProperties.bank_wide_project &&
        renderTd("bank_wide_project", issue.is_bank_wide_project ? "Yes" : "No", "min-w-[80px]")}
      {displayProperties.priority &&
        renderTd("priority", issue.priority || "—", "min-w-[80px]", undefined, "capitalize")}
      {displayProperties.state &&
        renderTd(
          "state",
          <span className="flex items-center gap-1">
            {issue.state_color && (
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: issue.state_color }} />
            )}
            {issue.state_name || "—"}
          </span>,
          "min-w-[100px]"
        )}
      {displayProperties.progress_tracking &&
        renderTd(
          "progress_tracking",
          <span className={progress?.className ?? "text-secondary"}>{progress?.label ?? "—"}</span>,
          "min-w-[100px]"
        )}
      {displayProperties.modules &&
        renderTd("modules", issue.module_names.length ? issue.module_names.join(", ") : "—", "min-w-[120px]")}
      {displayProperties.cycle && renderTd("cycle", issue.cycle_name || "—", "min-w-[100px]")}
      {displayProperties.start_date &&
        renderTd("start_date", issue.start_date ? renderFormattedDate(issue.start_date) : "—", "min-w-[100px]")}
      {displayProperties.due_date &&
        renderTd("due_date", issue.target_date ? renderFormattedDate(issue.target_date) : "—", "min-w-[100px]")}
      {displayProperties.completed_date &&
        renderTd("completed_date", issue.completed_at ? renderFormattedDate(issue.completed_at) : "—", "min-w-[100px]")}
      {displayProperties.total_log_time &&
        renderTd("total_log_time", formatLogTime(issue.total_log_time), "min-w-[80px]", undefined, "text-right")}
      {displayProperties.reference_link &&
        renderTd(
          "reference_link",
          issue.reference_link_count > 0 ? issue.reference_link_count : "—",
          "min-w-[80px]",
          undefined,
          "text-right"
        )}
    </tr>
  );
}

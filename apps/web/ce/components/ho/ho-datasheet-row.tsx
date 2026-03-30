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
  isScrolled?: boolean;
};

const CELL =
  "border-b-[0.5px] border-r-[0.5px] border-subtle-1 px-4 py-2.5 text-13 text-primary align-middle transition-[background-color]";

export function HoDatasheetRow({
  rowIndex,
  issue,
  displayProperties,
  isNewDeptGroup,
  isNewProjectGroup,
  isScrolled = false,
}: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";
  const progress = getProgressStatus(issue.target_date);

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  // Match widths from header
  const COL_WIDTHS: Record<string, string> = {
    department_name: "w-[180px]",
    project_name: "w-[180px]",
    main_task_category: "w-[180px]",
    sub_task_category: "w-[180px]",
    name: "w-[400px]",
    sub_issue_count: "w-[100px]",
    project_lead: "w-[150px]",
    assignee: "w-[180px]",
    bank_wide_project: "w-[120px]",
    priority: "w-[120px]",
    state: "w-[140px]",
    progress_tracking: "w-[140px]",
    modules: "w-[160px]",
    cycle: "w-[140px]",
    start_date: "w-[140px]",
    due_date: "w-[140px]",
    completed_date: "w-[140px]",
    total_log_time: "w-[120px]",
    reference_link: "w-[100px]",
  };

  const visibleKeys = Object.keys(COL_WIDTHS).filter((key) => key === "name" || displayProperties[key] !== false);
  const firstVisibleKey = visibleKeys[0];

  const renderTd = (key: string, content: React.ReactNode, textAlign?: string) => {
    const isFirst = key === firstVisibleKey;
    const width = COL_WIDTHS[key];

    return (
      <td
        className={cn(
          CELL,
          width,
          textAlign,
          isFirst
            ? cn(
                "sticky left-0 z-10 transition-shadow",
                isScrolled ? "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]" : ""
              )
            : "z-0",
          isFirst && frozenBg,
          isFirst && "group-hover:bg-layer-2"
        )}
      >
        <div className="truncate">{content}</div>
      </td>
    );
  };

  return (
    <tr
      className={cn(rowBorder, "odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors group h-11")}
    >
      {displayProperties.department_name && renderTd("department_name", issue.department_name || "—")}
      {displayProperties.project_name && renderTd("project_name", issue.project_name || "—")}
      {displayProperties.main_task_category && renderTd("main_task_category", issue.main_task_category_name || "—")}
      {displayProperties.sub_task_category && renderTd("sub_task_category", issue.sub_task_category_name || "—")}

      {/* Work Items — always visible */}
      {renderTd(
        "name",
        <a
          href={`/${issue.workspace_slug}/projects/${issue.project_id}/issues/${issue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-primary hover:underline line-clamp-1"
        >
          {issue.name}
        </a>
      )}

      {displayProperties.sub_issue_count && renderTd("sub_issue_count", issue.sub_issues_count, "text-right")}
      {displayProperties.project_lead && renderTd("project_lead", issue.project_lead || "—")}
      {displayProperties.assignee &&
        renderTd(
          "assignee",
          issue.assignees.length === 0
            ? "—"
            : issue.assignees
                .slice(0, 3)
                .map((a) => a.display_name)
                .join(", ") + (issue.assignees.length > 3 ? ` +${issue.assignees.length - 3}` : "")
        )}
      {displayProperties.bank_wide_project && renderTd("bank_wide_project", issue.is_bank_wide_project ? "Yes" : "No")}
      {displayProperties.priority && renderTd("priority", issue.priority || "—", "capitalize")}
      {displayProperties.state &&
        renderTd(
          "state",
          <span className="flex items-center gap-1.5">
            {issue.state_color && (
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: issue.state_color }} />
            )}
            <span className="truncate">{issue.state_name || "—"}</span>
          </span>
        )}
      {displayProperties.progress_tracking &&
        renderTd(
          "progress_tracking",
          <span className={cn("truncate font-medium", progress?.className ?? "text-secondary")}>
            {progress?.label ?? "—"}
          </span>
        )}
      {displayProperties.modules &&
        renderTd("modules", issue.module_names.length ? issue.module_names.join(", ") : "—")}
      {displayProperties.cycle && renderTd("cycle", issue.cycle_name || "—")}
      {displayProperties.start_date &&
        renderTd("start_date", issue.start_date ? renderFormattedDate(issue.start_date) : "—")}
      {displayProperties.due_date &&
        renderTd("due_date", issue.target_date ? renderFormattedDate(issue.target_date) : "—")}
      {displayProperties.completed_date &&
        renderTd("completed_date", issue.completed_at ? renderFormattedDate(issue.completed_at) : "—")}
      {displayProperties.total_log_time &&
        renderTd("total_log_time", formatLogTime(issue.total_log_time), "text-right")}
      {displayProperties.reference_link &&
        renderTd("reference_link", issue.reference_link_count > 0 ? issue.reference_link_count : "—", "text-right")}
    </tr>
  );
}

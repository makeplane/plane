import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/propel/avatar";
import { Popover } from "@plane/propel/popover";
import type { THoIssue } from "@/plane-web/services/ho-issue.service";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.defaults";
import { useWorklog } from "@/hooks/store/use-worklog";
import { renderFormattedDate, cn } from "@plane/utils";
import { getProgressStatus } from "../issues/issue-layouts/progress-tracking-utils";

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

export const HoDatasheetRow = observer(function HoDatasheetRow({
  rowIndex,
  issue,
  displayProperties,
  isNewDeptGroup,
  isNewProjectGroup,
  isScrolled = false,
}: Props) {
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";
  const progress = getProgressStatus(issue.target_date);

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  // Aggregate worklogs by user (cached in store)
  const worklogs = worklogStore.getWorklogsForIssue(issue.id);
  const userTotals = Object.values(
    worklogs.reduce<Record<string, { display_name: string; avatar_url: string; total_minutes: number }>>((acc, wl) => {
      const uid = wl.logged_by;
      if (!acc[uid]) {
        acc[uid] = {
          display_name: wl.logged_by_detail?.display_name ?? uid,
          avatar_url: wl.logged_by_detail?.avatar_url ?? "",
          total_minutes: 0,
        };
      }
      acc[uid].total_minutes += wl.duration_minutes;
      return acc;
    }, {})
  );

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    // Lazy-fetch worklogs on first open (only if not already cached)
    if (open && worklogs.length === 0 && issue.workspace_slug && issue.project_id) {
      setIsFetching(true);
      try {
        await worklogStore.fetchWorklogs(issue.workspace_slug, issue.project_id, issue.id);
      } finally {
        setIsFetching(false);
      }
    }
  };

  // Match widths from header
  const COL_WIDTHS: Record<string, string> = {
    department_name: "min-w-[180px]",
    project_name: "min-w-[180px]",
    main_task_category: "min-w-[180px]",
    sub_task_category: "min-w-[180px]",
    name: "min-w-[400px]",
    sub_issue_count: "min-w-[100px]",
    project_lead: "min-w-[150px]",
    assignee: "min-w-[180px]",
    bank_wide_project: "min-w-[120px]",
    priority: "min-w-[120px]",
    state: "min-w-[140px]",
    progress_tracking: "min-w-[140px]",
    modules: "min-w-[160px]",
    cycle: "min-w-[140px]",
    start_date: "min-w-[140px]",
    due_date: "min-w-[140px]",
    completed_date: "min-w-[140px]",
    total_log_time: "min-w-[120px]",
    reference_link: "min-w-[100px]",
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
            ? cn("sticky left-0 z-[5] transition-shadow", isScrolled ? "shadow-[2px_0_8px_rgba(0,0,0,0.1)]" : "")
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
        renderTd(
          "total_log_time",
          <Popover open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
            <Popover.Button
              className={cn(
                "w-full text-right outline-none transition-colors",
                issue.total_log_time > 0 ? "text-accent-primary hover:underline" : "text-secondary cursor-default"
              )}
            >
              {formatLogTime(issue.total_log_time)}
            </Popover.Button>
            {issue.total_log_time > 0 && (
              <Popover.Panel
                side="bottom"
                align="end"
                className="z-[25] min-w-52 rounded-md border border-subtle bg-surface-1 shadow-lg"
              >
                <div className="p-2 text-left">
                  <p className="mb-1.5 px-1 text-11 font-medium text-tertiary">{t("worklog.member")}</p>
                  {isFetching ? (
                    <p className="px-1 py-2 text-11 text-tertiary">{t("loading")}</p>
                  ) : userTotals.length === 0 ? (
                    <p className="px-1 py-2 text-11 text-tertiary">{t("worklog.no_entries")}</p>
                  ) : (
                    <div className="space-y-0.5">
                      {userTotals.map((entry) => (
                        <div
                          key={entry.display_name}
                          className="flex items-center justify-between gap-3 rounded px-1 py-1 hover:bg-layer-1"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={entry.display_name} src={entry.avatar_url} size="xs" shape="circle" />
                            <span className="truncate text-11 text-primary">{entry.display_name}</span>
                          </div>
                          <span className="flex-shrink-0 text-11 text-secondary">
                            {formatLogTime(entry.total_minutes)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popover.Panel>
            )}
          </Popover>,
          "text-right"
        )}
      {displayProperties.reference_link &&
        renderTd("reference_link", issue.reference_link_count > 0 ? issue.reference_link_count : "—", "text-right")}
    </tr>
  );
});

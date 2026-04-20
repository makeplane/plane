import type { ICycle, IIssueLabel, IModule, IUserLite } from "@plane/types";
import type { TIssue } from "@plane/types";
import { getProgressStatus } from "@/plane-web/components/issues/issue-layouts/progress-tracking-utils";

type TFunction = (key: string, params?: Record<string, unknown>) => string;

type Stores = {
  workspaceName: string;
  getStateById: (id: string | null | undefined) => { name: string } | undefined;
  getProjectById: (
    id: string | null | undefined
  ) => { name?: string; project_lead?: IUserLite | string | null; is_bank_wide?: boolean } | undefined | null;
  getModuleById: (id: string) => IModule | null;
  getCycleById: (id: string) => ICycle | null;
  getLabelById: (id: string) => IIssueLabel | null;
  getWorkspaceMemberDetails: (id: string) => { member?: { display_name?: string } } | null;
  getUserDetails: (id: string) => IUserLite | undefined;
};

function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function resolveProjectLead(
  lead: IUserLite | string | null | undefined,
  getUserDetails: Stores["getUserDetails"]
): string {
  if (!lead) return "-";
  if (typeof lead === "string") {
    const user = getUserDetails(lead);
    return user?.display_name ?? user?.email ?? "-";
  }
  return lead.display_name ?? lead.email ?? "-";
}

export function buildExportRow(issue: TIssue, t: TFunction, stores: Stores): Record<string, string | number> {
  const project = issue.project_id ? stores.getProjectById(issue.project_id) : null;
  const progressStatus = getProgressStatus(issue.target_date ?? null);

  return {
    [t("workspace_views.export.col_id")]: `#${issue.sequence_id}`,
    [t("workspace_views.export.col_title")]: issue.name ?? "-",
    [t("workspace_views.export.col_department")]: stores.workspaceName || "-",
    [t("workspace_views.export.col_project")]: project?.name ?? "-",
    [t("workspace_views.export.col_main_category")]: issue.main_task_category_name ?? "-",
    [t("workspace_views.export.col_sub_category")]: issue.sub_task_category_name ?? "-",
    [t("workspace_views.export.col_sub_issues")]: issue.sub_issues_count ?? 0,
    [t("workspace_views.export.col_project_lead")]: resolveProjectLead(project?.project_lead, stores.getUserDetails),
    [t("workspace_views.export.col_assignees")]: issue.assignee_ids?.length
      ? issue.assignee_ids.map((uid) => stores.getWorkspaceMemberDetails(uid)?.member?.display_name ?? uid).join(", ")
      : "-",
    [t("workspace_views.export.col_bank_wide")]: project?.is_bank_wide ? "Y" : "N",
    [t("workspace_views.export.col_priority")]: issue.priority
      ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)
      : "-",
    [t("workspace_views.export.col_state")]: issue.state_id ? (stores.getStateById(issue.state_id)?.name ?? "-") : "-",
    [t("workspace_views.export.col_progress")]: progressStatus?.label ?? "-",
    [t("workspace_views.export.col_modules")]: issue.module_ids?.length
      ? issue.module_ids.map((id) => stores.getModuleById(id)?.name ?? id).join(", ")
      : "-",
    [t("workspace_views.export.col_cycle")]: issue.cycle_id ? (stores.getCycleById(issue.cycle_id)?.name ?? "-") : "-",
    [t("workspace_views.export.col_start_date")]: issue.start_date ?? "-",
    [t("workspace_views.export.col_due_date")]: issue.target_date ?? "-",
    [t("workspace_views.export.col_completed_date")]: issue.completed_at?.slice(0, 10) ?? "-",
    [t("workspace_views.export.col_log_time")]: formatMinutes(issue.total_logged_minutes),
    [t("workspace_views.export.col_ref_link")]: issue.link_count ?? 0,
    [t("workspace_views.export.col_labels")]: issue.label_ids?.length
      ? issue.label_ids.map((id) => stores.getLabelById(id)?.name ?? id).join(", ")
      : "-",
    [t("workspace_views.export.col_estimate")]: issue.estimate_point ?? "-",
    [t("workspace_views.export.col_created_at")]: issue.created_at?.slice(0, 10) ?? "-",
    [t("workspace_views.export.col_updated_at")]: issue.updated_at?.slice(0, 10) ?? "-",
    [t("workspace_views.export.col_link_count")]: issue.link_count ?? 0,
    [t("workspace_views.export.col_attachments")]: issue.attachment_count ?? 0,
  };
}

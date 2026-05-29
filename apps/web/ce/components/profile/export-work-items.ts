import * as XLSX from "xlsx";
import type { TBaseIssue } from "@plane/types";
import { getProgressStatus } from "@/plane-web/components/issues/issue-layouts/progress-tracking-utils";

type ProjectLookup = { name: string; identifier: string };
type StateLookup = { name: string; color: string; group: string };

export type ExportableIssue = TBaseIssue & {
  _workspaceName: string;
  _project?: ProjectLookup;
  _state?: StateLookup;
  _mainCategoryName?: string;
  _subCategoryName?: string;
};

const formatDateForExport = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Columns mirror the on-screen table (work-items-table.tsx) so the export is a
// faithful copy of what the user sees, including category and progress columns.
export const exportWorkItemsXLSX = (issues: ExportableIssue[], filename: string): void => {
  const rows = issues.map((issue) => ({
    "Work Item": issue._project?.identifier
      ? `${issue._project.identifier}-${issue.sequence_id} ${issue.name}`
      : `${issue.sequence_id} ${issue.name}`,
    Department: issue._workspaceName,
    "Main Category": issue._mainCategoryName ?? "",
    "Sub Category": issue._subCategoryName ?? "",
    "Team/Project": issue._project?.name ?? "",
    Status: issue._state?.name ?? "",
    "Progress Tracking": getProgressStatus(issue.target_date ?? null)?.label ?? "",
    "Start Date": formatDateForExport(issue.start_date),
    "Due Date": formatDateForExport(issue.target_date),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Work Items");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

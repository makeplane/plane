import * as XLSX from "xlsx";
import type { TBaseIssue } from "@plane/types";

type ProjectLookup = { name: string; identifier: string };
type StateLookup = { name: string; color: string; group: string };

export type ExportableIssue = TBaseIssue & {
  _workspaceName: string;
  _project?: ProjectLookup;
  _state?: StateLookup;
};

const formatDateForExport = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const exportWorkItemsXLSX = (issues: ExportableIssue[], filename: string): void => {
  const rows = issues.map((issue) => ({
    "Work Item": issue._project?.identifier
      ? `${issue._project.identifier}-${issue.sequence_id} ${issue.name}`
      : `${issue.sequence_id} ${issue.name}`,
    Department: issue._workspaceName,
    Project: issue._project?.name ?? "",
    State: issue._state?.name ?? "",
    "Start Date": formatDateForExport(issue.start_date),
    "Due Date": formatDateForExport(issue.target_date),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Work Items");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

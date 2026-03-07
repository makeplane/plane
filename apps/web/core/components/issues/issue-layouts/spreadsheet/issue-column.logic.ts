import type { IIssueDisplayProperties, TIssue } from "@plane/types";

export const COLUMN_WIDTHS: Partial<Record<keyof IIssueDisplayProperties, string>> = {
  state: "80px",
  priority: "80px",
  assignee: "120px",
  estimate: "80px",
  labels: "80px",
  start_date: "120px",
  due_date: "120px",
  created_on: "120px",
  updated_on: "120px",
  link: "80px",
  attachment_count: "80px",
  sub_issue_count: "80px",
  cycle: "120px",
  modules: "120px",
};

export function getColumnWidth(property: keyof IIssueDisplayProperties): string {
  return COLUMN_WIDTHS[property] ?? "auto";
}

export async function handleUpdateIssueLogic(
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined,
  issue: TIssue,
  data: Partial<TIssue>
): Promise<void> {
  if (!updateIssue) return;
  await updateIssue(issue.project_id, issue.id, data);
}

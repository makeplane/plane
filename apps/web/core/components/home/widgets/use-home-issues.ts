/**
 * Questimus fork change (Phase 3): shared data hook for the home dashboard
 * sections (My Issues / Now / Today) — the issues assigned to the current
 * user across all projects, fetched from the workspace issues endpoint.
 */

import useSWR from "swr";
// services
import { IssueService } from "@/services/issue/issue.service";

const service = new IssueService();

export type THomeIssue = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  priority: string | null;
  target_date: string | null;
  state__group: string;
};

export const OPEN_STATE_GROUPS = ["backlog", "unstarted", "started"];
export const CLOSED_STATE_GROUPS = ["completed", "cancelled"];

/** Normalized due date (date-only) or null */
export const issueDueDate = (issue: THomeIssue): Date | null => {
  if (!issue.target_date) return null;
  const parsed = new Date(issue.target_date.slice(0, 10));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isOpenIssue = (issue: THomeIssue): boolean => OPEN_STATE_GROUPS.includes(issue.state__group);

export const useHomeIssues = (workspaceSlug: string | undefined, userId: string | undefined) => {
  const { data, isLoading } = useSWR(
    workspaceSlug && userId ? `HOME_ASSIGNED_ISSUES_${workspaceSlug}` : null,
    async () => {
      const filters = JSON.stringify({ assignee_id__in: userId });
      const res = await service.getWorkspaceIssues(workspaceSlug!, {
        filters,
        per_page: "100",
        order_by: "-created_at",
      });
      return (Array.isArray(res) ? res : (res?.results ?? [])) as THomeIssue[];
    }
  );
  return { issues: data ?? [], isLoading };
};

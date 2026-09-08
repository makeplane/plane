/**
 * Questimus fork change (Phase 3): SWR hook exposing a project's issue types.
 * Keyed per project — one fetch serves every row badge on a board.
 */

import useSWR from "swr";
// helpers
import { loadProjectIssueTypes, type TIssueType } from "@/helpers/issue-types.helper";

export const useProjectIssueTypes = (
  workspaceSlug: string | undefined,
  projectId: string | undefined
): TIssueType[] => {
  const { data } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    () => loadProjectIssueTypes(workspaceSlug!, projectId!)
  );
  return data ?? [];
};

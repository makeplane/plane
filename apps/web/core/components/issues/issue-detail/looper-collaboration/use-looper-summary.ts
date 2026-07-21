import useSWR from "swr";

import { LooperCollaborationService } from "@/services/issue";

const looperCollaborationService = new LooperCollaborationService();

export const useLooperSummary = (workspaceSlug: string, projectId: string, issueId: string) =>
  useSWR(
    workspaceSlug && projectId && issueId ? `LOOPER_SUMMARY_${workspaceSlug}_${projectId}_${issueId}` : null,
    () => looperCollaborationService.getSummary(workspaceSlug, projectId, issueId),
    {
      revalidateOnFocus: true,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
    }
  );

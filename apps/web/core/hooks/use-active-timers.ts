import useSWR from "swr";
import { IssueTimerService } from "@/services/issue/issue_timer.service";

const timerService = new IssueTimerService();

export const useActiveTimers = (workspaceSlug: string | undefined) => {
  const fetcher = () => {
    if (!workspaceSlug) return [];
    return timerService.getActiveTimers(workspaceSlug);
  };

  const { data, error, isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_ACTIVE_TIMERS_${workspaceSlug}` : null,
    fetcher,
    {
      refreshInterval: 30000, // 30s polling
      revalidateOnFocus: true,
    }
  );

  return {
    activeTimers: data || [],
    isLoading,
    error,
  };
};

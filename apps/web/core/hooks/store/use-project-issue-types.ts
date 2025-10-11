import { useCallback, useEffect, useState } from "react";
// services
import { ProjectIssueTypeService, TIssueType } from "@/services/project/project-issue-type.service";

export const useProjectIssueTypes = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  const [issueTypes, setIssueTypes] = useState<TIssueType[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectIssueTypeService = new ProjectIssueTypeService();

  const fetchIssueTypes = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const types = await projectIssueTypeService.fetchProjectIssueTypes(workspaceSlug, projectId);
      setIssueTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch issue types");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    fetchIssueTypes();
  }, [fetchIssueTypes]);

  return {
    issueTypes,
    isLoading,
    error,
    refetch: fetchIssueTypes,
  };
};
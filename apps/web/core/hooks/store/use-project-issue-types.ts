import { useCallback, useEffect, useState } from "react";
// services
import { ProjectIssueTypeService, TIssueType, projectIssueTypesCache } from "@/services/project/project-issue-type.service";

export const useProjectIssueTypes = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  const [issueTypes, setIssueTypes] = useState<TIssueType[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectIssueTypeService = new ProjectIssueTypeService();

  const fetchIssueTypes = useCallback(async () => {
    if (!workspaceSlug || !projectId) return;

    // 首先检查缓存
    const cacheKey = `${workspaceSlug}-${projectId}`;
    const cachedTypes = projectIssueTypesCache.get(cacheKey);
    
    if (cachedTypes) {
      // 如果缓存中有数据，直接使用
      setIssueTypes(Object.values(cachedTypes));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const types = await projectIssueTypeService.fetchProjectIssueTypes(workspaceSlug, projectId);
      setIssueTypes(types);
      
      // 更新缓存
      const typesMap = types.reduce((acc, type) => {
        acc[type.id] = type;
        return acc;
      }, {} as Record<string, TIssueType>);
      projectIssueTypesCache.set(cacheKey, typesMap);
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
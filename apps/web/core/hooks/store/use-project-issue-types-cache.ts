import { useCallback, useEffect, useState } from "react";
import { projectIssueTypesCache, TIssueType } from "@/services/project/project-issue-type.service";

export const useProjectIssueTypesFromCache = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  const [issueTypes, setIssueTypes] = useState<TIssueType[] | undefined>(undefined);

  const getCachedIssueTypes = useCallback(() => {
    if (!workspaceSlug || !projectId) return;

    const cacheKey = projectId;
    const cachedTypes = projectIssueTypesCache.get(cacheKey);
    
    if (cachedTypes) {
      setIssueTypes(Object.values(cachedTypes));
    }
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    getCachedIssueTypes();
    
    // 监听缓存变化（可以通过事件或定时器实现）
    const interval = setInterval(getCachedIssueTypes, 1000);
    return () => clearInterval(interval);
  }, [getCachedIssueTypes]);

  return {
    issueTypes,
    isLoading: false, // 从缓存读取不需要loading状态
    error: null,
  };
};
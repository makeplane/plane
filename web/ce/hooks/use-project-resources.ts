import { useProjectCoreResources } from "@/hooks/use-project-resources";

// Combined hook for all project resources
export const useProjectResources = (workspaceSlug: string | undefined, projectId: string | undefined) => {
  useProjectCoreResources(workspaceSlug, projectId);
  return {
    isLoading: false,
  };
};

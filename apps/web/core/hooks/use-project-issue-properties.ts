import { useProjectEstimates } from "./store/estimates";
import { useCycle } from "./store/use-cycle";
import { useLabel } from "./store/use-label";
import { useMember } from "./store/use-member";
import { useModule } from "./store/use-module";
import { useProjectState } from "./store/use-project-state";

export const useProjectIssueProperties = () => {
  const { fetchProjectStates } = useProjectState();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectLabels } = useLabel();
  const { fetchAllCycles: fetchProjectAllCycles } = useCycle();
  const { fetchModules: fetchProjectAllModules } = useModule();
  const { getProjectEstimates } = useProjectEstimates();

  // fetching project states
  const fetchStates = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await fetchProjectStates(workspaceSlug.toString(), projectId.toString());
    }
  };
  // fetching project members
  const fetchMembers = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await fetchProjectMembers(workspaceSlug.toString(), projectId.toString());
    }
  };

  // fetching project labels
  const fetchLabels = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await fetchProjectLabels(workspaceSlug.toString(), projectId.toString());
    }
  };
  // fetching project cycles
  const fetchCycles = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await fetchProjectAllCycles(workspaceSlug.toString(), projectId.toString());
    }
  };
  // fetching project modules
  const fetchModules = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await fetchProjectAllModules(workspaceSlug.toString(), projectId.toString());
    }
  };
  // fetching project estimates
  const fetchEstimates = async (
    workspaceSlug: string | string[] | undefined,
    projectId: string | string[] | undefined
  ) => {
    if (workspaceSlug && projectId) {
      await getProjectEstimates(workspaceSlug.toString(), projectId.toString());
    }
  };

  const fetchAll = async (workspaceSlug: string | string[] | undefined, projectId: string | string[] | undefined) => {
    if (workspaceSlug && projectId) {
      await fetchStates(workspaceSlug, projectId);
      await fetchMembers(workspaceSlug, projectId);
      await fetchLabels(workspaceSlug, projectId);
      await fetchCycles(workspaceSlug, projectId);
      await fetchModules(workspaceSlug, projectId);
      await fetchEstimates(workspaceSlug, projectId);
    }
  };

  return {
    fetchAll,
    fetchStates,
    fetchMembers,
    fetchLabels,
    fetchCycles,
    fetchModules,
    fetchEstimates,
  };
};

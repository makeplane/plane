import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectService } from "services/project";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";

const projectService = new ProjectService();

const useProjectDetails = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    data: projectDetails,
    error: projectDetailsError,
    mutate: mutateProjectDetails,
  } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  return {
    projectDetails,
    projectDetailsError,
    mutateProjectDetails,
  };
};

export default useProjectDetails;

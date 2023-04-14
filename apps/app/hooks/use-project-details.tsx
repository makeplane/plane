import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";

const useProjectDetails = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    data: projectDetails,
    error: projectDetailsError,
    mutate: mutateProjectDetails,
  } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  useEffect(() => {
    if (projectDetailsError?.status === 404) {
      router.push("/404");
    } else if (projectDetailsError) {
      router.push("/error");
    }
  }, [projectDetailsError, router]);

  return {
    projectDetails,
    projectDetailsError,
    mutateProjectDetails,
  };
};

export default useProjectDetails;

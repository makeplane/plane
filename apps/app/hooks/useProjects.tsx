import { FC, ReactElement, createContext } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
// types
import { IProject } from "types";
// services
import projectService from "services/project.service";
// constants
import { WORKSPACE_DETAILS, PROJECTS_LIST, PROJECT_MEMBERS } from "constants/fetch-keys";

const useProjects = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // api fetching
  const { data: projects, mutate: mutateProjects } = useSWR<IProject[]>(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null
  );

  return {
    projects,
    mutateProjects,
  };
};

export default useProjects;

import useSWR from "swr";
import { useRouter } from "next/router";
// services
import projectService from "services/project.service";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

const useProjects = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // api fetching
  const { data: projects, mutate: mutateProjects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null
  );

  const recentProjects = projects
    ?.sort((a, b) => Date.parse(`${a.updated_at}`) - Date.parse(`${b.updated_at}`))
    .filter((_item, index) => index < 3);

  return {
    projects: projects || [],
    recentProjects: recentProjects || [],
    mutateProjects,
  };
};

export default useProjects;

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// helpers
import { orderArrayBy } from "helpers/array.helper";
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
    projects: orderArrayBy(projects ?? [], "is_favorite", "descending") || [],
    recentProjects: recentProjects || [],
    mutateProjects,
  };
};

export default useProjects;

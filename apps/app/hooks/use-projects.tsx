import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

const useProjects = (type?: "all" | boolean) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: projects, mutate: mutateProjects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string, { is_favorite: type ?? "all" }) : null,
    workspaceSlug
      ? () => projectService.getProjects(workspaceSlug as string, { is_favorite: type ?? "all" })
      : null
  );

  const recentProjects = [...(projects ?? [])]
    ?.sort((a, b) => Date.parse(`${a.updated_at}`) - Date.parse(`${b.updated_at}`))
    ?.slice(0, 3);

  return {
    projects: projects
      ? (orderArrayBy(projects, "is_favorite", "descending") as IProject[])
      : undefined,
    recentProjects: recentProjects || [],
    mutateProjects,
  };
};

export default useProjects;

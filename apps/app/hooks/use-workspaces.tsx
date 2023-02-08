import useSWR from "swr";
import { useRouter } from "next/router";
// types
import { IWorkspace } from "types";
// services
import workspaceService from "services/workspace.service";
// constants
import { USER_WORKSPACES } from "constants/fetch-keys";

const useWorkspaces = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // API to fetch user information
  const {
    data = [],
    error,
    mutate,
  } = useSWR<IWorkspace[]>(USER_WORKSPACES, () => workspaceService.userWorkspaces());
  // active workspace
  const activeWorkspace = data?.find((w) => w.slug === workspaceSlug);

  return {
    workspaces: data,
    error,
    activeWorkspace,
    mutateWorkspaces: mutate,
  };
};

export default useWorkspaces;

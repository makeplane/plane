import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";

const workspaceService = new WorkspaceService();

const useWorkspaceDetails = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // Fetching Workspace Details
  const {
    data: workspaceDetails,
    error: workspaceDetailsError,
    mutate: mutateWorkspaceDetails,
  } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.getWorkspace(workspaceSlug as string) : null
  );

  useEffect(() => {
    if (workspaceDetailsError?.status === 404) {
      router.push("/404");
    } else if (workspaceDetailsError) {
      router.push("/error");
    }
  }, [workspaceDetailsError, router]);

  return {
    workspaceDetails,
    workspaceDetailsError,
    mutateWorkspaceDetails,
  };
};

export default useWorkspaceDetails;

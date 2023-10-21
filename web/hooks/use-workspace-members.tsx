import useSWR from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// hooks
import useUser from "./use-user";

const workspaceService = new WorkspaceService();

const useWorkspaceMembers = (workspaceSlug: string | undefined, fetchCondition?: boolean) => {
  fetchCondition = fetchCondition ?? true;

  const { user } = useUser();

  const { data: workspaceMembers, error: workspaceMemberErrors } = useSWR(
    workspaceSlug && fetchCondition ? WORKSPACE_MEMBERS(workspaceSlug) : null,
    workspaceSlug && fetchCondition ? () => workspaceService.workspaceMembers(workspaceSlug) : null
  );

  const hasJoined = workspaceMembers?.some((item: any) => item.member.id === (user as any)?.id);

  const isOwner = workspaceMembers?.some((item) => item.member.id === (user as any)?.id && item.role === 20);
  const isMember = workspaceMembers?.some((item) => item.member.id === (user as any)?.id && item.role === 15);
  const isViewer = workspaceMembers?.some((item) => item.member.id === (user as any)?.id && item.role === 10);
  const isGuest = workspaceMembers?.some((item) => item.member.id === (user as any)?.id && item.role === 5);

  return {
    workspaceMembers,
    workspaceMemberErrors,
    hasJoined,
    isOwner,
    isMember,
    isViewer,
    isGuest,
  };
};

export default useWorkspaceMembers;

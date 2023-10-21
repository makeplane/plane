import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// hooks
import useUser from "./use-user";

const projectService = new ProjectService();

const useProjectMembers = (
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  fetchCondition?: boolean
) => {
  fetchCondition = fetchCondition ?? true;

  const { user } = useUser();
  // fetching project members
  const { data: members } = useSWR(
    workspaceSlug && projectId && fetchCondition ? PROJECT_MEMBERS(projectId) : null,
    workspaceSlug && projectId && fetchCondition ? () => projectService.projectMembers(workspaceSlug, projectId) : null
  );

  const hasJoined = members?.some((item: any) => item.member.id === (user as any)?.id);

  const isOwner = members?.some((item) => item.member.id === (user as any)?.id && item.role === 20);
  const isMember = members?.some((item) => item.member.id === (user as any)?.id && item.role === 15);
  const isViewer = members?.some((item) => item.member.id === (user as any)?.id && item.role === 10);
  const isGuest = members?.some((item) => item.member.id === (user as any)?.id && item.role === 5);

  return {
    members,
    hasJoined,
    isOwner,
    isMember,
    isViewer,
    isGuest,
  };
};

export default useProjectMembers;

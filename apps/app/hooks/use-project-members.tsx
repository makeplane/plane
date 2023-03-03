import useSWR from "swr";
// services
import projectService from "services/project.service";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
// hooks
import useUser from "./use-user";

const useProjectMembers = (workspaceSlug: string, projectId: string) => {
  const { user } = useUser();
  // fetching project members
  const { data: members } = useSWR(PROJECT_MEMBERS(projectId), () =>
    projectService.projectMembers(workspaceSlug, projectId)
  );

  const hasJoined = members?.some((item: any) => item.member.id === (user as any)?.id);

  const isOwner = members?.some((item) => item.member.id === (user as any)?.id && item.role === 20);
  const isMember = members?.some(
    (item) => item.member.id === (user as any)?.id && item.role === 15
  );
  const isViewer = members?.some(
    (item) => item.member.id === (user as any)?.id && item.role === 10
  );
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

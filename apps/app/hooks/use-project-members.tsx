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

  const isMember = members?.some((item: any) => item.member.id === (user as any)?.id);

  const canEdit = members?.some(
    (item) => (item.member.id === (user as any)?.id && item.role === 20) || item.role === 15
  );
  const canDelete = members?.some(
    (item) => item.member.id === (user as any)?.id && item.role === 20
  );

  return {
    members,
    isMember,
    canEdit,
    canDelete,
  };
};

export default useProjectMembers;

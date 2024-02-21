import useSWR from "swr";

import { ProjectMemberService } from "services/project";
import { IProjectMember } from "@plane/types";
import { UserService } from "services/user.service";
import { useRef, useEffect } from "react";

export const useMention = ({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) => {
  const userService = new UserService();
  const projectMemberService = new ProjectMemberService();

  const { data: projectMembers } = useSWR(["projectMembers", workspaceSlug, projectId], async () => {
    const members = await projectMemberService.fetchProjectMembers(workspaceSlug, projectId);
    const detailedMembers = await Promise.all(
      members.map(async (member) => projectMemberService.getProjectMember(workspaceSlug, projectId, member.id))
    );
    return detailedMembers;
  });

  const projectMembersRef = useRef<IProjectMember[] | undefined>();

  useEffect(() => {
    if (projectMembers) {
      projectMembersRef.current = projectMembers;
    }
  }, [projectMembers]);

  const { data: user } = useSWR("currentUser", async () => userService.currentUser());

  const mentionHighlights = user ? [user.id] : [];

  const getMentionSuggestions = () => () => {
    const mentionSuggestions =
      projectMembersRef.current?.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.member?.id}`,
        type: "User",
        title: `${memberDetails?.member?.display_name}`,
        subtitle: memberDetails?.member?.email ?? "",
        avatar: `${memberDetails?.member?.avatar}`,
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.member?.id}`,
      })) || [];

    return mentionSuggestions;
  };
  return {
    getMentionSuggestions,
    mentionHighlights,
  };
};

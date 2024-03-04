import useSWR from "swr";
import { useRef, useEffect } from "react";
import { ProjectMemberService } from "services/project";
import { IProjectMember, IUser } from "@plane/types";
import { UserService } from "services/user.service";

export const useMention = ({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) => {
  const userService = new UserService();
  const projectMemberService = new ProjectMemberService();

  const { data: projectMembers, isLoading: projectMembersLoading } = useSWR(
    ["projectMembers", workspaceSlug, projectId],
    async () => {
      const members = await projectMemberService.fetchProjectMembers(workspaceSlug, projectId);
      const detailedMembers = await Promise.all(
        members.map(async (member) => projectMemberService.getProjectMember(workspaceSlug, projectId, member.id))
      );
      return detailedMembers;
    }
  );
  const { data: user, isLoading: userDataLoading } = useSWR("currentUser", async () => userService.currentUser());

  const projectMembersRef = useRef<IProjectMember[] | undefined>();
  const userRef = useRef<IUser | undefined>();

  useEffect(() => {
    if (projectMembers) {
      projectMembersRef.current = projectMembers;
    }
  }, [projectMembers]);

  useEffect(() => {
    if (userRef) {
      userRef.current = user;
    }
  }, [user]);

  const waitForUserDate = async () =>
    new Promise<IUser>((resolve) => {
      const checkData = () => {
        if (userRef.current) {
          resolve(userRef.current);
        } else {
          setTimeout(checkData, 100);
        }
      };
      checkData();
    });

  const mentionHighlights = async () => {
    if (!userDataLoading && userRef.current) {
      return [userRef.current.id];
    } else {
      const user = await waitForUserDate();
      return [user.id];
    }
  };

  // Polling function to wait for projectMembersRef.current to be populated
  const waitForData = async () =>
    new Promise<IProjectMember[]>((resolve) => {
      const checkData = () => {
        if (projectMembersRef.current && projectMembersRef.current.length > 0) {
          resolve(projectMembersRef.current);
        } else {
          setTimeout(checkData, 100); // Check every 100ms
        }
      };
      checkData();
    });

  const mentionSuggestions = async () => {
    if (!projectMembersLoading && projectMembersRef.current && projectMembersRef.current.length > 0) {
      // If data is already available, return it immediately
      return projectMembersRef.current.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.member?.id}`,
        type: "User",
        title: `${memberDetails?.member?.display_name}`,
        subtitle: memberDetails?.member?.email ?? "",
        avatar: `${memberDetails?.member?.avatar}`,
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.member?.id}`,
      }));
    } else {
      // Wait for data to be available
      const members = await waitForData();
      return members.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.member?.id}`,
        type: "User",
        title: `${memberDetails?.member?.display_name}`,
        subtitle: memberDetails?.member?.email ?? "",
        avatar: `${memberDetails?.member?.avatar}`,
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.member?.id}`,
      }));
    }
  };

  return {
    mentionSuggestions,
    mentionHighlights,
  };
};

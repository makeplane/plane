"use client";

import { useRef, useEffect } from "react";
// plane editor
import { IMentionSuggestion } from "@plane/editor";
// plane types
import { IUser, IUserLite } from "@plane/types";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  workspaceSlug?: string;
  projectId?: string;
  members?: IUserLite[] | undefined;
  user?: IUser | undefined;
};

export const useMention = ({ workspaceSlug, projectId, members, user }: Props) => {
  const projectMembersRef = useRef<IUserLite[] | undefined>();
  const userRef = useRef<IUser | undefined>();

  const {
    project: { fetchProjectMembers },
  } = useMember();

  useEffect(() => {
    if (members) projectMembersRef.current = members;
    else {
      if (!workspaceSlug || !projectId) return;
      fetchProjectMembers(workspaceSlug.toString(), projectId.toString());
    }
  }, [fetchProjectMembers, members, projectId, workspaceSlug]);

  useEffect(() => {
    if (userRef) userRef.current = user;
  }, [user]);

  const waitForUserData = async () =>
    new Promise<IUser>((resolve) => {
      const checkData = () => {
        if (userRef.current) resolve(userRef.current);
        else setTimeout(checkData, 100);
      };
      checkData();
    });

  const mentionHighlights = async () => {
    if (user && userRef.current) {
      return [userRef.current.id];
    } else {
      const userData = await waitForUserData();
      return [userData.id];
    }
  };

  // Polling function to wait for projectMembersRef.current to be populated
  const waitForData = async () =>
    new Promise<IUserLite[]>((resolve) => {
      const checkData = () => {
        if (projectMembersRef.current && projectMembersRef.current.length > 0) {
          resolve(projectMembersRef.current);
        } else {
          setTimeout(checkData, 100); // Check every 100ms
        }
      };
      checkData();
    });

  const mentionSuggestions = async (): Promise<IMentionSuggestion[]> => {
    if (members && projectMembersRef.current && projectMembersRef.current.length > 0) {
      // If data is already available, return it immediately
      return projectMembersRef.current.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.id}`,
        id: `${memberDetails?.id}`,
        type: "User",
        title: `${memberDetails?.display_name}`,
        subtitle: memberDetails?.email ?? "",
        avatar: getFileURL(memberDetails?.avatar_url) ?? "",
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.id}`,
      }));
    } else {
      // Wait for data to be available
      const membersList = await waitForData();
      return membersList.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.id}`,
        id: `${memberDetails?.id}`,
        type: "User",
        title: `${memberDetails?.display_name}`,
        subtitle: memberDetails?.email ?? "",
        avatar: getFileURL(memberDetails?.avatar_url) ?? "",
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.id}`,
      }));
    }
  };

  return {
    mentionSuggestions,
    mentionHighlights,
  };
};

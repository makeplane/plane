"use client";

import { useRef, useEffect } from "react";
// types
import { IUser, IUserLite } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  members?: IUserLite[] | undefined;
  user?: IUser | undefined;
};

export const useWorkspaceMention = (props: Props) => {
  const { workspaceSlug, members, user } = props;
  // refs
  const workspaceMembersRef = useRef<IUserLite[] | undefined>();
  const userRef = useRef<IUser | undefined>();

  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();

  useEffect(() => {
    if (members) workspaceMembersRef.current = members;
    else {
      if (!workspaceSlug) return;
      fetchWorkspaceMembers(workspaceSlug);
    }
  }, [fetchWorkspaceMembers, members, workspaceSlug]);

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

  // Polling function to wait for workspaceMembersRef.current to be populated
  const waitForData = async () =>
    new Promise<IUserLite[]>((resolve) => {
      const checkData = () => {
        if (workspaceMembersRef.current && workspaceMembersRef.current.length > 0) {
          resolve(workspaceMembersRef.current);
        } else {
          setTimeout(checkData, 100); // Check every 100ms
        }
      };
      checkData();
    });

  const mentionSuggestions = async () => {
    if (members && workspaceMembersRef.current && workspaceMembersRef.current.length > 0) {
      // If data is already available, return it immediately
      return workspaceMembersRef.current.map((memberDetails) => ({
        entity_name: "user_mention",
        entity_identifier: `${memberDetails?.id}`,
        id: `${memberDetails?.id}`,
        type: "User",
        title: `${memberDetails?.display_name}`,
        subtitle: memberDetails?.email ?? "",
        avatar: `${memberDetails?.avatar_url}`,
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
        avatar: `${memberDetails?.avatar_url}`,
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.id}`,
      }));
    }
  };

  return {
    mentionSuggestions,
    mentionHighlights,
  };
};

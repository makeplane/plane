import { useMemo } from "react";
import { MemberOption } from "../../components/pages/share";
import { TPageShareFormUser } from "./use-page-share-form";

type TMemberOptionsHookProps = {
  workspaceMemberIds: string[];
  currentUserId: string | undefined;
  sharedUsers: TPageShareFormUser[];
  getWorkspaceMemberDetails: (id: string) => any;
};

export const useMemberOptions = ({
  workspaceMemberIds,
  currentUserId,
  sharedUsers,
  getWorkspaceMemberDetails,
}: TMemberOptionsHookProps) => {
  // Simple filtering - React Hook Form already tracks the shared users
  const memberOptions = useMemo(() => {
    if (!currentUserId) return [];

    const sharedUserIds = new Set(sharedUsers.map((u) => u.user_id));

    return workspaceMemberIds
      .filter((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId);
        if (!memberDetails?.member) return false;

        const member = memberDetails.member;
        // Exclude current user and already shared users
        return member.id !== currentUserId && !sharedUserIds.has(member.id);
      })
      .map((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId);
        const member = memberDetails.member;

        return {
          value: member.id,
          query: `${member.first_name} ${member.last_name} ${member.display_name}`.toLowerCase(),
          content: <MemberOption key={member.id} member={member} />,
        };
      });
  }, [workspaceMemberIds, currentUserId, sharedUsers, getWorkspaceMemberDetails]);

  return { memberOptions };
};

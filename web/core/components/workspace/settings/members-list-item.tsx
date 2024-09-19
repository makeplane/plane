"use client";

import { FC } from "react";
import { isEmpty } from "lodash";
import { observer } from "mobx-react";
// ui
import { IWorkspaceMember } from "@plane/types";
import { TOAST_TYPE, Table, setToast } from "@plane/ui";
// components
import { MembersLayoutLoader } from "@/components/ui/loader/layouts/members-layout-loader";
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace";
// constants
import { WORKSPACE_MEMBER_LEAVE } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useMember, useUser, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useMemberColumns } from "@/plane-web/components/workspace/settings/useMemberColumns";

type Props = {
  memberDetails: (IWorkspaceMember | null)[];
};

export const WorkspaceMembersListItem: FC<Props> = observer((props) => {
  const { memberDetails } = props;
  const { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal } = useMemberColumns();
  // router
  const router = useAppRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    workspace: { removeMemberFromWorkspace },
  } = useMember();
  const { leaveWorkspace } = useUserPermissions();
  const { captureEvent } = useEventTracker();
  // derived values

  const handleLeaveWorkspace = async () => {
    if (!workspaceSlug || !currentUser) return;

    await leaveWorkspace(workspaceSlug.toString())
      .then(() => {
        captureEvent(WORKSPACE_MEMBER_LEAVE, {
          state: "SUCCESS",
          element: "Workspace settings members page",
        });
        router.push("/profile");
      })
      .catch((err: any) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceSlug || !memberId) return;

    await removeMemberFromWorkspace(workspaceSlug.toString(), memberId).catch((err) =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.error || "Something went wrong. Please try again.",
      })
    );
  };

  const handleRemove = async (memberId: string) => {
    if (memberId === currentUser?.id) await handleLeaveWorkspace();
    else await handleRemoveMember(memberId);
  };

  // is the member current logged in user
  // const isCurrentUser = memberDetails?.member.id === currentUser?.id;
  // is the current logged in user admin
  // role change access-
  // 1. user cannot change their own role
  // 2. only admin or member can change role
  // 3. user cannot change role of higher role

  if (isEmpty(columns)) return <MembersLayoutLoader />;

  return (
    <div className="border-t border-custom-border-100">
      {removeMemberModal && (
        <ConfirmWorkspaceMemberRemove
          isOpen={removeMemberModal.member.id.length > 0}
          onClose={() => setRemoveMemberModal(null)}
          userDetails={{
            id: removeMemberModal.member.id,
            display_name: removeMemberModal.member.display_name || "",
          }}
          onSubmit={() => handleRemove(removeMemberModal.member.id)}
        />
      )}
      <Table
        columns={columns ?? []}
        data={(memberDetails?.filter((member): member is IWorkspaceMember => member !== null) ?? []) as any}
        keyExtractor={(rowData) => rowData?.member.id ?? ""}
        tHeadClassName="border-b border-custom-border-100"
        thClassName="text-left font-medium divide-x-0"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0"
        tHeadTrClassName="divide-x-0"
      />
    </div>
  );
});

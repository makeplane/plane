import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceMember } from "@plane/types";
import { Table } from "@plane/ui";
// components
import { MembersLayoutLoader } from "@/components/ui/loader/layouts/members-layout-loader";
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace/confirm-workspace-member-remove";
import type { RowData } from "@/components/workspace/settings/member-columns";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions, useUserSettings } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useMemberColumns } from "@/plane-web/components/workspace/settings/useMemberColumns";

type Props = {
  memberDetails: (IWorkspaceMember | null)[];
};

export const WorkspaceMembersListItem = observer(function WorkspaceMembersListItem(props: Props) {
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
  const { getWorkspaceRedirectionUrl } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();
  const { t } = useTranslation();
  // derived values

  const handleLeaveWorkspace = async () => {
    if (!workspaceSlug || !currentUser) return;

    try {
      await leaveWorkspace(workspaceSlug.toString());
      await fetchCurrentUserSettings();
      router.push(getWorkspaceRedirectionUrl());
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || t("something_went_wrong_please_try_again"),
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceSlug || !memberId) return;

    try {
      await removeMemberFromWorkspace(workspaceSlug.toString(), memberId);
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || t("something_went_wrong_please_try_again"),
      });
    }
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
    <div className="border-t border-subtle grid">
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
      <Table<RowData>
        columns={columns ?? []}
        data={
          (memberDetails?.filter((member): member is IWorkspaceMember => member !== null) ?? []) as unknown as RowData[]
        }
        keyExtractor={(rowData) => rowData?.member.id ?? ""}
        tHeadClassName="border-b border-subtle"
        thClassName="text-left font-medium divide-x-0 text-placeholder"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0 p-4 h-10 text-secondary"
        tHeadTrClassName="divide-x-0"
      />
    </div>
  );
});

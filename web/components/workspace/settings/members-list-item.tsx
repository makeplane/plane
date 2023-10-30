import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { ConfirmWorkspaceMemberRemove } from "components/workspace";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// icons
import { ChevronDown, XCircle } from "lucide-react";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  member: {
    id: string;
    memberId: string;
    avatar: string;
    first_name: string;
    last_name: string;
    email: string | undefined;
    display_name: string;
    role: 5 | 10 | 15 | 20;
    status: boolean;
    member: boolean;
    accountCreated: boolean;
  };
};

// services
const workspaceService = new WorkspaceService();

export const WorkspaceMembersListItem: React.FC<Props> = (props) => {
  const { member } = props;

  const [removeMemberModal, setRemoveMemberModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { workspace: workspaceStore, user: userStore } = useMobxStore();

  const user = userStore.workspaceMemberInfo;
  const isAdmin = userStore.workspaceMemberInfo?.role === 20;

  const handleRemoveMember = async () => {
    if (!workspaceSlug) return;

    if (member.member)
      await workspaceStore.removeMember(workspaceSlug.toString(), member.id).catch((err) => {
        const error = err?.error;
        setToastAlert({
          type: "error",
          title: "Error",
          message: error || "Something went wrong",
        });
      });
    else
      await workspaceService
        .deleteWorkspaceInvitations(workspaceSlug.toString(), member.id)
        .then(() => {
          setToastAlert({
            type: "success",
            title: "Success",
            message: "Member removed successfully",
          });
        })
        .catch((err) => {
          const error = err?.error;

          setToastAlert({
            type: "error",
            title: "Error",
            message: error || "Something went wrong",
          });
        });
  };

  if (!user) return null;

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        data={member}
        onSubmit={handleRemoveMember}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          {member.avatar && member.avatar !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <a className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={member.avatar}
                  className="absolute top-0 left-0 h-full w-full object-cover rounded"
                  alt={member.display_name || member.email}
                />
              </a>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <a className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize bg-gray-700 text-white">
                {(member.email ?? member.display_name ?? "?")[0]}
              </a>
            </Link>
          )}
          <div>
            {member.member ? (
              <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                <a className="text-sm font-medium">
                  {member.first_name} {member.last_name}
                </a>
              </Link>
            ) : (
              <h4 className="text-sm cursor-default">{member.display_name || member.email}</h4>
            )}
            <p className="mt-0.5 text-xs text-custom-sidebar-text-300">{member.email ?? member.display_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {!member?.status && (
            <div className="flex items-center justify-center rounded bg-yellow-500/20 px-2.5 py-1 text-center text-xs text-yellow-500 font-medium">
              <p>Pending</p>
            </div>
          )}
          {member?.status && !member?.accountCreated && (
            <div className="flex items-center justify-center rounded bg-blue-500/20 px-2.5 py-1 text-center text-xs text-blue-500 font-medium">
              <p>Account not created</p>
            </div>
          )}
          <CustomSelect
            customButton={
              <div className="flex item-center gap-1 px-2 py-0.5 rounded">
                <span
                  className={`flex items-center text-xs font-medium rounded ${
                    member.memberId !== user.member ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[member.role as keyof typeof ROLE]}
                </span>
                {member.memberId !== user.member && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={member.role}
            onChange={(value: 5 | 10 | 15 | 20 | undefined) => {
              if (!workspaceSlug) return;

              workspaceStore
                .updateMember(workspaceSlug.toString(), member.id, {
                  role: value,
                })
                .catch(() => {
                  setToastAlert({
                    type: "error",
                    title: "Error!",
                    message: "An error occurred while updating member role. Please try again.",
                  });
                });
            }}
            disabled={
              member.memberId === user.member || !member.status || (user.role !== 20 && user.role < member.role)
            }
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (user.role !== 20 && user.role < parseInt(key)) return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          {isAdmin && (
            <Tooltip tooltipContent={member.memberId === user.member ? "Leave workspace" : "Remove member"}>
              <button
                type="button"
                onClick={() => setRemoveMemberModal(true)}
                className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
              >
                <XCircle className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={2} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
};

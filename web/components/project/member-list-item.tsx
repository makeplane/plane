import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { ConfirmProjectMemberRemove } from "components/project";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// icons
import { ChevronDown, Dot, XCircle } from "lucide-react";
// constants
import { ROLE } from "constants/workspace";
// types
import { IProjectMember, TUserProjectRole } from "types";

type Props = {
  member: IProjectMember;
};

export const ProjectMemberListItem: React.FC<Props> = observer((props) => {
  const { member } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const {
    user: { currentUser, currentProjectMemberInfo, currentProjectRole, leaveProject },
    projectMember: { removeMemberFromProject, updateMember },
  } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  // derived values
  const isAdmin = currentProjectRole === 20;
  const memberDetails = member.member;

  const handleRemove = async () => {
    if (!workspaceSlug || !projectId) return;

    if (memberDetails.id === currentUser?.id) {
      await leaveProject(workspaceSlug.toString(), projectId.toString())
        .then(() => router.push(`/${workspaceSlug}/projects`))
        .catch((err) =>
          setToastAlert({
            type: "error",
            title: "Error",
            message: err?.error || "Something went wrong. Please try again.",
          })
        );
    } else
      await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), member.id).catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <>
      <ConfirmProjectMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        data={member.member}
        onSubmit={handleRemove}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          {memberDetails.avatar && memberDetails.avatar !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${memberDetails.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={memberDetails.avatar}
                  alt={memberDetails.display_name || memberDetails.email}
                  className="absolute top-0 left-0 h-full w-full object-cover rounded"
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${memberDetails.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize bg-gray-700 text-white">
                {(memberDetails.display_name ?? memberDetails.email ?? "?")[0]}
              </span>
            </Link>
          )}

          <div>
            <Link href={`/${workspaceSlug}/profile/${memberDetails.id}`}>
              <span className="text-sm font-medium">
                {memberDetails.first_name} {memberDetails.last_name}
              </span>
            </Link>
            <div className="flex items-center">
              <p className="text-xs text-custom-text-300">{memberDetails.display_name}</p>
              {isAdmin && (
                <>
                  <Dot height={16} width={16} className="text-custom-text-300" />
                  <p className="text-xs text-custom-text-300">{memberDetails.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <CustomSelect
            customButton={
              <div className="flex item-center gap-1 px-2 py-0.5 rounded">
                <span
                  className={`flex items-center text-xs font-medium rounded ${
                    memberDetails.id !== currentProjectMemberInfo?.id ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[member.role as keyof typeof ROLE]}
                </span>
                {memberDetails.id !== currentProjectMemberInfo?.id && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={member.role}
            onChange={(value: TUserProjectRole | undefined) => {
              if (!workspaceSlug || !projectId) return;

              updateMember(workspaceSlug.toString(), projectId.toString(), member.id, {
                role: value,
              }).catch((err) => {
                const error = err.error;
                const errorString = Array.isArray(error) ? error[0] : error;

                setToastAlert({
                  type: "error",
                  title: "Error!",
                  message: errorString ?? "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={
              memberDetails.id === currentUser?.id ||
              !member.member ||
              (currentProjectRole && currentProjectRole !== 20 && currentProjectRole < member.role)
            }
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (currentProjectRole && currentProjectRole !== 20 && currentProjectRole < parseInt(key)) return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          {isAdmin && (
            <Tooltip
              tooltipContent={
                memberDetails.id === currentProjectMemberInfo?.member.id ? "Leave project" : "Remove member"
              }
            >
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
});

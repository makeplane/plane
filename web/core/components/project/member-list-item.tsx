"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// icons
import { ChevronDown, Dot, XCircle } from "lucide-react";
// ui
import { CustomSelect, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ConfirmProjectMemberRemove } from "@/components/project";
// constants
import { PROJECT_MEMBER_LEAVE } from "@/constants/event-tracker";
import { EUserProjectRoles } from "@/constants/project";
import { ROLE } from "@/constants/workspace";
// hooks
import { useEventTracker, useMember, useProject, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  userId: string;
};

export const ProjectMemberListItem: React.FC<Props> = observer((props) => {
  const { userId } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    membership: { currentProjectRole, leaveProject },
  } = useUser();
  const { data: currentUser } = useUser();
  const { fetchProjects } = useProject();
  const {
    project: { removeMemberFromProject, getProjectMemberDetails, updateMember },
  } = useMember();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const userDetails = getProjectMemberDetails(userId);

  const handleRemove = async () => {
    if (!workspaceSlug || !projectId || !userDetails) return;

    if (userDetails.member?.id === currentUser?.id) {
      await leaveProject(workspaceSlug.toString(), projectId.toString())
        .then(async () => {
          captureEvent(PROJECT_MEMBER_LEAVE, {
            state: "SUCCESS",
            element: "Project settings members page",
          });
          await fetchProjects(workspaceSlug.toString());
          router.push(`/${workspaceSlug}/projects`);
        })
        .catch((err: any) =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err?.error || "Something went wrong. Please try again.",
          })
        );
    } else
      await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), userDetails.member?.id).catch(
        (err) =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err?.error || "Something went wrong. Please try again.",
          })
      );
  };

  if (!userDetails) return null;

  return (
    <>
      <ConfirmProjectMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        data={userDetails.member}
        onSubmit={handleRemove}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          {userDetails.member?.avatar && userDetails.member?.avatar !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${userDetails.member?.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={userDetails.member?.avatar}
                  alt={userDetails.member?.display_name || userDetails.member?.email}
                  className="absolute left-0 top-0 h-full w-full rounded object-cover"
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${userDetails.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
                {(userDetails.member?.display_name ?? userDetails.member?.email ?? "?")[0]}
              </span>
            </Link>
          )}

          <div>
            <Link href={`/${workspaceSlug}/profile/${userDetails.member?.id}`}>
              <span className="text-sm font-medium">
                {userDetails.member?.first_name} {userDetails.member?.last_name}
              </span>
            </Link>
            <div className="flex items-center">
              <p className="text-xs text-custom-text-300">{userDetails.member?.display_name}</p>
              {isAdmin && (
                <>
                  <Dot height={16} width={16} className="text-custom-text-300" />
                  <p className="text-xs text-custom-text-300">{userDetails.member?.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <CustomSelect
            customButton={
              <div className="item-center flex gap-1 rounded px-2 py-0.5">
                <span
                  className={`flex items-center rounded text-xs font-medium ${
                    userDetails.member?.id !== currentUser?.id ? "" : "text-custom-text-400"
                  }`}
                >
                  {ROLE[userDetails.role]}
                </span>
                {userDetails.member?.id !== currentUser?.id && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={userDetails.role}
            onChange={(value: EUserProjectRoles) => {
              if (!workspaceSlug || !projectId) return;

              updateMember(workspaceSlug.toString(), projectId.toString(), userDetails.member?.id, {
                role: value,
              }).catch((err) => {
                const error = err.error;
                const errorString = Array.isArray(error) ? error[0] : error;

                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Error!",
                  message: errorString ?? "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={
              userDetails.member?.id === currentUser?.id || !currentProjectRole || currentProjectRole < userDetails.role
            }
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (currentProjectRole && !isAdmin && currentProjectRole < parseInt(key)) return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          {(isAdmin || userDetails.member?.id === currentUser?.id) && (
            <Tooltip
              tooltipContent={userDetails.member?.id === currentUser?.id ? "Leave project" : "Remove member"}
              isMobile={isMobile}
            >
              <button
                type="button"
                onClick={() => setRemoveMemberModal(true)}
                className="pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
              >
                <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
});

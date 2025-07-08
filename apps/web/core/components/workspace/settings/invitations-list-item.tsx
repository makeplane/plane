"use client";

import { useState, FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown, LinkIcon, Trash2 } from "lucide-react";
// plane imports
import { ROLE, EUserPermissions, EUserPermissionsLevel, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomSelect, TOAST_TYPE, setToast, TContextMenuItem, CustomMenu } from "@plane/ui";
import { cn, copyTextToClipboard } from "@plane/utils";
// components
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useMember, useUserPermissions } from "@/hooks/store";

type Props = {
  invitationId: string;
};

export const WorkspaceInvitationsListItem: FC<Props> = observer((props) => {
  const { invitationId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions, workspaceInfoBySlug } = useUserPermissions();
  const {
    workspace: { updateMemberInvitation, deleteMemberInvitation, getWorkspaceInvitationDetails },
  } = useMember();
  // derived values
  const invitationDetails = getWorkspaceInvitationDetails(invitationId);
  const currentWorkspaceMemberInfo = workspaceInfoBySlug(workspaceSlug.toString());
  const currentWorkspaceRole = currentWorkspaceMemberInfo?.role;
  // is the current logged in user admin
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  // role change access-
  // 1. user cannot change their own role
  // 2. only admin or member can change role
  // 3. user cannot change role of higher role
  const hasRoleChangeAccess = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleRemoveInvitation = async () => {
    if (!workspaceSlug || !invitationDetails) return;

    await deleteMemberInvitation(workspaceSlug.toString(), invitationDetails.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Invitation removed successfully.",
        });
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  if (!invitationDetails || !currentWorkspaceMemberInfo) return null;

  const handleCopyText = () => {
    try {
      const inviteLink = new URL(invitationDetails.invite_link, window.location.origin).href;
      copyTextToClipboard(inviteLink).then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.link_copied"),
          message: t("entity.link_copied_to_clipboard", { entity: t("common.invite") }),
        });
      });
    } catch (error) {
      console.error("Error generating invite link:", error);
    }
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("common.actions.copy_link"),
      icon: LinkIcon,
      shouldRender: !!invitationDetails.invite_link,
    },
    {
      key: "remove",
      action: () => {
        captureClick({
          elementName: MEMBER_TRACKER_ELEMENTS.WORKSPACE_INVITATIONS_LIST_CONTEXT_MENU,
        });
        setRemoveMemberModal(true);
      },
      title: t("common.remove"),
      icon: Trash2,
      shouldRender: isAdmin,
      className: "text-red-500",
      iconClassName: "text-red-500",
    },
  ];

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        userDetails={{
          id: invitationDetails.id,
          display_name: `${invitationDetails.email}`,
        }}
        onSubmit={handleRemoveInvitation}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90 w-full h-full">
        <div className="flex items-center gap-x-4 gap-y-2">
          <span className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
            {(invitationDetails.email ?? "?")[0]}
          </span>
          <div>
            <h4 className="cursor-default text-sm">{invitationDetails.email}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center justify-center rounded bg-yellow-500/20 px-2.5 py-1 text-center text-xs font-medium text-yellow-500">
            <p>{t("common.pending")}</p>
          </div>
          <CustomSelect
            customButton={
              <div className="item-center flex gap-1 rounded px-2 py-0.5">
                <span
                  className={`flex items-center rounded text-xs font-medium ${
                    hasRoleChangeAccess ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[invitationDetails.role]}
                </span>
                {hasRoleChangeAccess && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={invitationDetails.role}
            onChange={(value: EUserPermissions) => {
              if (!workspaceSlug || !value) return;

              updateMemberInvitation(workspaceSlug.toString(), invitationDetails.id, {
                role: value,
              }).catch((error) => {
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Error!",
                  message: error?.error || "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={!hasRoleChangeAccess}
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (currentWorkspaceRole && currentWorkspaceRole !== 20 && currentWorkspaceRole < parseInt(key))
                return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          {isAdmin && (
            <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
              {MENU_ITEMS.map((item) => {
                if (item.shouldRender === false) return null;
                return (
                  <CustomMenu.MenuItem
                    key={item.key}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.action();
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      {
                        "text-custom-text-400": item.disabled,
                      },
                      item.className
                    )}
                    disabled={item.disabled}
                  >
                    {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                    <div>
                      <h5>{item.title}</h5>
                      {item.description && (
                        <p
                          className={cn("text-custom-text-300 whitespace-pre-line", {
                            "text-custom-text-400": item.disabled,
                          })}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </CustomMenu.MenuItem>
                );
              })}
            </CustomMenu>
          )}
        </div>
      </div>
    </>
  );
});

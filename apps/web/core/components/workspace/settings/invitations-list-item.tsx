/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LinkIcon, TrashIcon, ChevronDownIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { CustomSelect, CustomMenu } from "@plane/ui";
import { cn, copyTextToClipboard, getAssignableWorkspaceRoles } from "@plane/utils";
// components
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace/confirm-workspace-member-remove";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  workspaceSlug: string;
  invitationId: string;
  permissions: {
    canChangeRole: (targetRoleSlug: string) => boolean;
    canRemoveInvitation: boolean;
  };
};

export const WorkspaceInvitationsListItem = observer(function WorkspaceInvitationsListItem(props: Props) {
  const { workspaceSlug, invitationId, permissions } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    workspace: { updateMemberInvitation, deleteMemberInvitation, getWorkspaceInvitationDetails },
  } = useMember();
  const { getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  const { getWorkspaceRoleDetailsByRoleSlug, getWorkspaceRolesByWorkspaceSlug } = useRoleManagement();
  // derived values
  const invitationDetails = getWorkspaceInvitationDetails(invitationId);
  const invitationRoleDetails = invitationDetails
    ? getWorkspaceRoleDetailsByRoleSlug(workspaceSlug, invitationDetails.role_slug)
    : undefined;
  const isRoleEditable = invitationDetails ? permissions.canChangeRole(invitationDetails.role_slug) : false;
  const assignableWorkspaceRoles = getAssignableWorkspaceRoles(
    getWorkspaceRolesByWorkspaceSlug(workspaceSlug, "active"),
    getCurrentUserWorkspaceRoleSlug(workspaceSlug)
  );

  const handleRemoveInvitation = async () => {
    try {
      if (!invitationDetails) return;

      await deleteMemberInvitation(workspaceSlug.toString(), invitationDetails.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Invitation removed successfully.",
      });
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || "Something went wrong. Please try again.",
      });
    }
  };

  if (!invitationDetails) return null;

  const handleCopyText = async () => {
    try {
      const inviteLink = new URL(invitationDetails.invite_link, window.location.origin).href;
      await copyTextToClipboard(inviteLink);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("entity.link_copied_to_clipboard", { entity: t("common.invite") }),
      });
    } catch (error) {
      console.error("Error generating invite link:", error);
    }
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: () => void handleCopyText(),
      title: t("common.actions.copy_link"),
      icon: LinkIcon,
      shouldRender: !!invitationDetails.invite_link,
    },
    {
      key: "remove",
      action: () => {
        setRemoveMemberModal(true);
      },
      title: t("common.remove"),
      icon: TrashIcon,
      shouldRender: permissions.canRemoveInvitation,
      className: "text-danger-primary",
      iconClassName: "text-danger-primary",
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
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-layer-transparent-hover w-full h-full">
        <div className="flex items-center gap-x-4 gap-y-2">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-layer-3 p-4 capitalize text-tertiary">
            {(invitationDetails.email ?? "?")[0]}
          </span>
          <div>
            <h4 className="cursor-default text-body-xs-regular">{invitationDetails.email}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 text-11">
          <div className="flex items-center justify-center rounded-sm bg-label-yellow-bg-strong/20 px-2.5 py-1 text-center text-caption-sm-medium text-label-yellow-text">
            <p>{t("common.pending")}</p>
          </div>
          <CustomSelect
            customButton={
              <div className="item-center flex gap-1 rounded-sm px-2 py-0.5">
                <span
                  className={`flex items-center rounded-sm text-caption-sm-medium ${
                    isRoleEditable ? "" : "text-placeholder"
                  }`}
                >
                  {invitationRoleDetails?.name ?? "—"}
                </span>
                {isRoleEditable && (
                  <span className="grid place-items-center">
                    <ChevronDownIcon className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={invitationDetails.role_slug}
            onChange={(value: string) => {
              updateMemberInvitation(workspaceSlug, invitationDetails.id, {
                role_slug: value,
              }).catch((err: unknown) => {
                const error = err as { error?: string };
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Error!",
                  message: error?.error || "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={!isRoleEditable}
            placement="bottom-end"
          >
            {assignableWorkspaceRoles.map((role) => {
              return (
                <CustomSelect.Option key={role.slug} value={role.slug}>
                  {role.name}
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
            {MENU_ITEMS.map((item) => {
              if (item.shouldRender === false) return null;
              return (
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={() => {
                    item.action();
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    {
                      "text-placeholder": item.disabled,
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
                        className={cn("text-tertiary whitespace-pre-line", {
                          "text-placeholder": item.disabled,
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
        </div>
      </div>
    </>
  );
});

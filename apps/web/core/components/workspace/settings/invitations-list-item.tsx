/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ROLE, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownOutline, DeleteOutline, LinkOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import type { TContextMenuItem } from "@plane/blocks/context-menu";
import { getRenderableItems, resolveItemVariant } from "@plane/blocks/context-menu";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import { copyTextToClipboard } from "@plane/utils";
// components
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace/confirm-workspace-member-remove";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";

type TRoleOption = { key: number; label: string };

type Props = {
  invitationId: string;
};

// The role list opens flush with the trigger's right edge, as `placement="bottom-end"` did.
const ROLE_DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

export const WorkspaceInvitationsListItem = observer(function WorkspaceInvitationsListItem(props: Props) {
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
  // non-admins can only assign roles up to their own
  const roleOptions: TRoleOption[] = Object.entries(ROLE)
    .map(([key, label]) => ({ key: parseInt(key, 10), label }))
    .filter(
      (role) =>
        !(currentWorkspaceRole && Number(currentWorkspaceRole) !== 20 && Number(currentWorkspaceRole) < role.key)
    );

  const handleRemoveInvitation = async () => {
    try {
      if (!workspaceSlug || !invitationDetails) return;

      await deleteMemberInvitation(workspaceSlug.toString(), invitationDetails.id);
      setToast({
        type: "success",
        title: "Success!",
        message: "Invitation removed successfully.",
      });
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: "error",
        title: "Error!",
        message: error?.error || "Something went wrong. Please try again.",
      });
    }
  };

  if (!invitationDetails || !currentWorkspaceMemberInfo) return null;

  const handleCopyText = async () => {
    try {
      const inviteLink = new URL(invitationDetails.invite_link, window.location.origin).href;
      await copyTextToClipboard(inviteLink);
      setToast({
        type: "success",
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
      icon: LinkOutline,
      shouldRender: !!invitationDetails.invite_link,
    },
    {
      key: "remove",
      action: () => {
        setRemoveMemberModal(true);
      },
      title: t("common.remove"),
      icon: DeleteOutline,
      shouldRender: isAdmin,
      variant: "danger",
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
      <div className="group flex h-full w-full items-center justify-between px-3 py-4 hover:bg-layer-transparent-hover">
        <div className="flex items-center gap-x-4 gap-y-2">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-layer-3 p-4 text-tertiary capitalize">
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
          <SelectDropdownPlacementContext.Provider value={ROLE_DROPDOWN_PLACEMENT}>
            <Select<TRoleOption>
              value={roleOptions.find((role) => role.key === invitationDetails.role) ?? null}
              onChange={(val) => {
                const value = Number(val) as EUserPermissions;
                if (!workspaceSlug || !value) return;

                updateMemberInvitation(workspaceSlug.toString(), invitationDetails.id, {
                  role: value,
                }).catch((err: unknown) => {
                  const error = err as { error?: string };
                  setToast({
                    type: "error",
                    title: "Error!",
                    message: error?.error || "An error occurred while updating member role. Please try again.",
                  });
                });
              }}
              getValues={() => roleOptions}
              getOptionValue={(role) => String(role.key)}
              getOptionLabel={(role) => role.label}
              disabled={!hasRoleChangeAccess}
              showSearch={false}
              pinSelected={false}
            >
              <Select.Trigger<TRoleOption>
                variant="pill-sm"
                appendIcon={hasRoleChangeAccess ? <ChevronDownOutline /> : undefined}
              >
                <span className="min-w-0 truncate">{ROLE[invitationDetails.role]}</span>
              </Select.Trigger>
            </Select>
          </SelectDropdownPlacementContext.Provider>
          {isAdmin && (
            <Menu>
              <MenuTrigger
                render={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={t("aria_labels.common.more_actions")}
                    icon={<Icon icon={MoreHorizontalOutline} />}
                  />
                }
              />
              <MenuContent side="bottom" align="end">
                {getRenderableItems(MENU_ITEMS).map((item) => (
                  <MenuItem
                    key={item.key}
                    variant={resolveItemVariant(item)}
                    icon={item.icon ? <Icon icon={item.icon} /> : undefined}
                    label={item.title ?? ""}
                    description={item.description}
                    disabled={item.disabled}
                    onClick={() => {
                      item.action();
                    }}
                  />
                ))}
              </MenuContent>
            </Menu>
          )}
        </div>
      </div>
    </>
  );
});

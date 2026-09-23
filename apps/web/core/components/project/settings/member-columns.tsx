/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { CircleMinus } from "lucide-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import { ROLE, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EUserProjectRoles, IUser, IWorkspaceMember, TProjectMembership } from "@plane/types";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";

export interface RowData extends Pick<TProjectMembership, "original_role"> {
  member: IWorkspaceMember;
}

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  isAdmin: boolean;
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
};

type TRoleOption = {
  key: string;
  label: string;
};

type AccountTypeProps = {
  rowData: RowData;
  currentProjectRole: EUserPermissions | undefined;
  workspaceSlug: string;
  projectId: string;
};

export function NameColumn(props: NameProps) {
  const { rowData, workspaceSlug, isAdmin, currentUser, setRemoveMemberModal } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const { avatar_url, display_name, email, first_name, id, last_name } = rowData.member;

  return (
    <div className="group relative">
      <div className="flex w-72 items-center gap-2">
        <div className="flex flex-1 items-center gap-x-2 gap-y-2">
          {avatar_url && avatar_url.trim() !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${id}`}>
              <span className="relative flex size-6 items-center justify-center rounded-full text-on-color capitalize">
                <img
                  src={getFileURL(avatar_url)}
                  className="absolute top-0 left-0 h-full w-full rounded-full object-cover"
                  alt={display_name || email}
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${id}`}>
              <span className="relative flex size-6 items-center justify-center rounded-full bg-layer-3 text-11 text-on-color capitalize">
                {(email ?? display_name ?? "?")[0]}
              </span>
            </Link>
          )}
          {first_name} {last_name}
        </div>
        {(isAdmin || id === currentUser?.id) && (
          <Menu>
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
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
            </div>
            <MenuContent side="bottom" align="end">
              <MenuItem
                variant="danger"
                icon={<Icon icon={CircleMinus} />}
                label={rowData.member?.id === currentUser?.id ? t("leave") : t("remove")}
                onClick={() => setRemoveMemberModal(rowData)}
              />
            </MenuContent>
          </Menu>
        )}
      </div>
    </div>
  );
}

export const AccountTypeColumn = observer(function AccountTypeColumn(props: AccountTypeProps) {
  const { rowData, projectId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    project: { updateMemberRole },
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { data: currentUser } = useUser();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // derived values
  const roleLabel = ROLE[rowData.original_role ?? EUserPermissions.GUEST];
  const isCurrentUser = currentUser?.id === rowData.member.id;
  const isRowDataWorkspaceAdmin = [EUserPermissions.ADMIN].includes(
    Number(getWorkspaceMemberDetails(rowData.member.id)?.role) ?? EUserPermissions.GUEST
  );
  const isCurrentUserWorkspaceAdmin = currentUser
    ? [EUserPermissions.ADMIN].includes(
        Number(getWorkspaceMemberDetails(currentUser.id)?.role) ?? EUserPermissions.GUEST
      )
    : false;
  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);

  const isCurrentUserProjectAdmin = currentProjectRole
    ? ![EUserPermissions.MEMBER, EUserPermissions.GUEST].includes(Number(currentProjectRole) ?? EUserPermissions.GUEST)
    : false;

  // logic
  // Workspace admin can change his own role
  // Project admin can change any role except his own and workspace admin's role
  const isRoleEditable =
    (isCurrentUserWorkspaceAdmin && isCurrentUser) ||
    (isCurrentUserProjectAdmin && !isRowDataWorkspaceAdmin && !isCurrentUser);
  const checkCurrentOptionWorkspaceRole = (value: string) => {
    const currentMemberWorkspaceRole = getWorkspaceMemberDetails(value)?.role as EUserPermissions | undefined;
    if (!value || !currentMemberWorkspaceRole) return ROLE;

    const isGuest = [EUserPermissions.GUEST].includes(currentMemberWorkspaceRole);

    return Object.fromEntries(
      Object.entries(ROLE).filter(([key]) => !isGuest || parseInt(key) === EUserPermissions.GUEST)
    );
  };

  return (
    <>
      {isRoleEditable ? (
        <Controller
          name="role"
          control={control}
          rules={{ required: "Role is required." }}
          render={() => {
            const roleOptions: TRoleOption[] = Object.entries(checkCurrentOptionWorkspaceRole(rowData.member.id)).map(
              ([key, label]) => ({ key, label })
            );
            return (
              <div className="w-32">
                <Select<TRoleOption>
                  getValues={() => roleOptions}
                  value={roleOptions.find((option) => option.key === String(rowData.original_role)) ?? null}
                  onChange={(value) => {
                    if (!workspaceSlug || !value) return;
                    void updateMemberRole(
                      workspaceSlug.toString(),
                      projectId.toString(),
                      rowData.member.id,
                      Number(value) as EUserProjectRoles
                    ).catch((err) => {
                      console.log(err, "err");
                      const error = err.error;
                      const errorString = Array.isArray(error) ? error[0] : error;

                      setToast({
                        type: "error",
                        title: "You can’t change this role yet.",
                        message: errorString ?? "An error occurred while updating member role. Please try again.",
                      });
                    });
                  }}
                  getOptionValue={(option) => option.key}
                  getOptionLabel={(option) => option.label}
                  placeholder={t("role")}
                  showSearch={false}
                  pinSelected={false}
                >
                  <Select.Trigger<TRoleOption>
                    variant="select-ghost-md"
                    className={errors.role ? "border border-danger-strong" : undefined}
                  >
                    <span className="min-w-0 grow truncate text-left">{roleLabel}</span>
                  </Select.Trigger>
                </Select>
              </div>
            );
          }}
        />
      ) : (
        <div className="flex w-32">
          <span>{roleLabel}</span>
        </div>
      )}
    </>
  );
});

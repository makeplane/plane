/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";

import { Disclosure } from "@headlessui/react";
// plane imports
import { ROLE, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { DeactivatedUserOutline, DeleteOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IWorkspaceMember } from "@plane/types";
// plane ui
import { CustomSelect, PopoverMenu } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// components
import { AI_ACCOUNTS_LIST } from "@/components/ai-accounts/constants";
import { RotateAIAccountTokenModal } from "@/components/ai-accounts/rotate-token-modal";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// services
import { aiAccountService } from "@/services/ai-account.service";

export interface RowData {
  member: IWorkspaceMember;
  role: EUserPermissions;
  is_active: boolean;
}

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  isAdmin: boolean;
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
};

type AccountTypeProps = {
  rowData: RowData;
  workspaceSlug: string;
};

export function NameColumn(props: NameProps) {
  const { rowData, workspaceSlug, isAdmin, currentUser, setRemoveMemberModal } = props;
  // states
  const [showRotateTokenModal, setShowRotateTokenModal] = useState(false);
  // hooks
  const { t } = useTranslation();
  // derived values
  const { avatar_url, display_name, email, first_name, id, is_bot, last_name } = rowData.member;
  const isSuspended = rowData.is_active === false;
  // Same data source as the AI badge below: only AI agent bots get the rotate entry
  const isAIAgentBot = is_bot && rowData.member.bot_type === "AI_AGENT";
  // The rotate endpoint works on the AIAccount, not the bot user — resolve the
  // account backing this member row (admin-only settings page, SWR dedupes per row)
  const { data: aiAccounts } = useSWR(
    isAIAgentBot && isAdmin && workspaceSlug ? AI_ACCOUNTS_LIST(workspaceSlug.toString()) : null,
    isAIAgentBot && isAdmin && workspaceSlug
      ? () => aiAccountService.fetchAIAccountsList(workspaceSlug.toString())
      : null
  );
  const aiAccount = aiAccounts?.find((account) => account.bot_user.id === id);
  const showRotateTokenMenuItem = isAdmin && !!aiAccount;

  return (
    <Disclosure>
      {() => (
        <div className="group relative">
          <div className="flex w-72 items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-1 items-center gap-x-2 gap-y-2">
              {isSuspended ? (
                <div className="rounded-full bg-layer-1">
                  <DeactivatedUserOutline className="size-6 text-placeholder" />
                </div>
              ) : avatar_url && avatar_url.trim() !== "" ? (
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
                  <span className="relative flex size-6 items-center justify-center rounded-full bg-layer-3 text-11 text-tertiary capitalize">
                    {(email ?? display_name ?? "?")[0]}
                  </span>
                </Link>
              )}
              <span className={isSuspended ? "text-placeholder" : ""}>
                {first_name} {last_name}
              </span>
              {is_bot && (
                <span className="flex-shrink-0 rounded bg-layer-1 px-1.5 py-0.5 text-11 text-tertiary">AI</span>
              )}
            </div>

            {!isSuspended && (isAdmin || id === currentUser?.id) && (
              <PopoverMenu
                data={showRotateTokenMenuItem ? ["rotate-token", "remove"] : ["remove"]}
                keyExtractor={(item) => item}
                popoverClassName="justify-end"
                buttonClassName="outline-none	origin-center rotate-90 size-8 aspect-square flex-shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                render={(item) =>
                  item === "rotate-token" ? (
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-x-3"
                      onClick={() => setShowRotateTokenModal(true)}
                    >
                      {t("workspace_settings.settings.ai_accounts.list.rotate_token")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-x-3"
                      onClick={() => setRemoveMemberModal(rowData)}
                    >
                      <DeleteOutline className="size-3.5 align-middle" />{" "}
                      {id === currentUser?.id ? "Leave " : "Remove "}
                    </button>
                  )
                }
              />
            )}
            {aiAccount && (
              <RotateAIAccountTokenModal
                account={aiAccount}
                isOpen={showRotateTokenModal}
                onClose={() => setShowRotateTokenModal(false)}
                workspaceSlug={workspaceSlug.toString()}
              />
            )}
          </div>
        </div>
      )}
    </Disclosure>
  );
}

export const AccountTypeColumn = observer(function AccountTypeColumn(props: AccountTypeProps) {
  const { rowData, workspaceSlug } = props;
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const {
    workspace: { updateMember },
  } = useMember();
  const { data: currentUser } = useUser();

  // derived values
  const isCurrentUser = currentUser?.id === rowData.member.id;
  const isAdminRole = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isRoleNonEditable = isCurrentUser || !isAdminRole;
  const isSuspended = rowData.is_active === false;

  return (
    <>
      {isSuspended ? (
        <div className="flex w-32">
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="border-none">
            Suspended
          </Pill>
        </div>
      ) : isRoleNonEditable ? (
        <div className="flex w-32">
          <span>{ROLE[rowData.role]}</span>
        </div>
      ) : (
        <Controller
          name="role"
          control={control}
          rules={{ required: "Role is required." }}
          render={({ field: { value } }) => (
            <CustomSelect
              value={value as EUserPermissions}
              onChange={async (newRole: EUserPermissions) => {
                if (!workspaceSlug) return;
                try {
                  await updateMember(workspaceSlug.toString(), rowData.member.id, {
                    role: newRole as unknown as EUserPermissions,
                  });
                } catch (err: unknown) {
                  const error = err as { error?: string | string[] };
                  const errorString = Array.isArray(error?.error) ? error.error[0] : error?.error;

                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title: "Error!",
                    message: errorString ?? "An error occurred while updating member role. Please try again.",
                  });
                }
              }}
              label={
                <div className="flex">
                  <span>{ROLE[rowData.role]}</span>
                </div>
              }
              buttonClassName={`!px-0 !justify-start hover:bg-surface-1 ${errors.role ? "border-danger-strong" : "border-none"}`}
              className="w-32 rounded-md p-0"
              input
            >
              {Object.keys(ROLE).map((item) => (
                <CustomSelect.Option key={item} value={item as unknown as EUserPermissions}>
                  {ROLE[item as unknown as keyof typeof ROLE]}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      )}
    </>
  );
});

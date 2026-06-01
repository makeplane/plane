/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LogOut } from "lucide-react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar, CustomMenu } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useUser } from "@/hooks/store/user";

// Account menu for the standalone /help shell. /help has no workspace context, so
// this surfaces only the signed-in identity + sign-out — both are workspace-independent,
// so it renders correctly even for a user who belongs to no workspace.
export const HelpCenterUserMenu = observer(function HelpCenterUserMenu() {
  const { t } = useTranslation();
  const { data: currentUser, signOut } = useUser();

  const handleSignOut = () => {
    signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("auth.sign_out.toast.error.title"),
        message: t("auth.sign_out.toast.error.message"),
      })
    );
  };

  if (!currentUser) return null;

  const fullName =
    [currentUser.first_name, currentUser.last_name].filter(Boolean).join(" ").trim() || currentUser.display_name;
  const avatarSrc = getFileURL(currentUser.avatar_url ?? "");

  return (
    <CustomMenu
      ariaLabel={t("help_center.account_menu_label")}
      placement="bottom-end"
      optionsClassName="w-64 p-2"
      customButton={
        <span className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-surface-2">
          <Avatar name={currentUser.display_name} src={avatarSrc} size={24} shape="circle" />
          <span className="hidden max-w-[140px] truncate text-13 text-secondary sm:block">{fullName}</span>
        </span>
      }
      customButtonClassName="grid place-items-center"
      closeOnSelect
    >
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <Avatar name={currentUser.display_name} src={avatarSrc} size={36} shape="circle" />
        <div className="min-w-0">
          <p className="truncate text-13 font-medium text-primary">{fullName}</p>
          <p className="truncate text-11 text-tertiary">{currentUser.email}</p>
        </div>
      </div>
      <div className="my-1.5 border-t border-subtle" />
      <CustomMenu.MenuItem onClick={handleSignOut} className="flex items-center gap-2">
        <LogOut className="size-3.5 shrink-0" />
        {t("sign_out")}
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { LogOutOutline, PreferencesOutline, SettingsOutline } from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { getFileURL } from "@plane/utils";
// components
import { CoverImage } from "@/components/common/cover-image";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";

export const UserMenuRoot = observer(function UserMenuRoot() {
  // states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const { toggleAnySidebarDropdown } = useAppTheme();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  const { toggleProfileSettingsModal } = useCommandPalette();
  // derived values
  const isUserInstanceAdmin = false;
  // translation
  const { t } = useTranslation();

  const handleSignOut = () => {
    signOut().catch(() =>
      setToast({
        type: "error",
        title: t("auth.sign_out.toast.error.title"),
        message: t("auth.sign_out.toast.error.message"),
      })
    );
  };

  // Toggle sidebar dropdown state when menu is open
  useEffect(() => {
    if (isUserMenuOpen) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isUserMenuOpen, toggleAnySidebarDropdown]);

  return (
    <div className="flex items-center">
      <Menu onOpenChange={setIsUserMenuOpen}>
        <MenuTrigger
          render={
            <IconButton
              variant="ghost"
              size="md"
              aria-label={t("aria_labels.projects_sidebar.open_user_menu")}
              render={<button type="button" className="data-popup-open:bg-layer-transparent-active" />}
            >
              <Avatar
                alt={currentUser?.display_name}
                fallback={currentUser?.display_name?.[0]?.toUpperCase()}
                src={getFileURL(currentUser?.avatar_url ?? "")}
                size="xs"
              />
            </IconButton>
          }
        />
        <MenuContent side="bottom" align="end">
          <div className="flex w-70 max-w-full flex-col p-1">
            <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-lg px-2 py-4">
              <CoverImage
                src={currentUser?.cover_image_url ?? undefined}
                alt=""
                className="absolute inset-0 size-full"
                showDefaultWhenEmpty
              />
              <div className="absolute inset-0 bg-black/50" />
              <Avatar
                alt={currentUser?.display_name}
                fallback={currentUser?.display_name?.[0]?.toUpperCase()}
                src={getFileURL(currentUser?.avatar_url ?? "")}
                size="xl"
              />
              <div className="relative w-full min-w-0 text-center text-on-color">
                <p className="truncate text-body-sm-medium">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <Tooltip label={currentUser?.email ?? ""}>
                  <p className="truncate text-caption-md-regular">{currentUser?.email}</p>
                </Tooltip>
              </div>
            </div>
            <div className="mt-1">
              <MenuItem
                icon={<Icon icon={SettingsOutline} />}
                label={t("settings")}
                onClick={() =>
                  toggleProfileSettingsModal({
                    activeTab: "general",
                    isOpen: true,
                  })
                }
              />
              <MenuItem
                icon={<Icon icon={PreferencesOutline} />}
                label={t("preferences")}
                onClick={() =>
                  toggleProfileSettingsModal({
                    activeTab: "preferences",
                    isOpen: true,
                  })
                }
              />
              {isUserInstanceAdmin && (
                <MenuItem variant="accent" label={t("enter_god_mode")} onClick={() => router.push(GOD_MODE_URL)} />
              )}
            </div>
            <MenuSeparator />
            <MenuItem
              variant="danger"
              icon={<Icon icon={LogOutOutline} />}
              label={t("sign_out")}
              onClick={handleSignOut}
            />
          </div>
        </MenuContent>
      </Menu>
    </div>
  );
});

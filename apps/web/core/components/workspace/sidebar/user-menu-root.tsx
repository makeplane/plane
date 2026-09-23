/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { LogOutOutline, SettingsOutline } from "@makeplane/propel/icons";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { getFileURL } from "@plane/utils";
// components
import { CoverImage } from "@/components/common/cover-image";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
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
        {/* propel: `AppSidebarItem` takes no arbitrary props, so it cannot be the Base UI trigger
            — the popup would have no element to anchor to. The trigger is a plain button wearing
            the same chrome, with the item's own icon part inside it. */}
        <MenuTrigger
          render={
            <button
              type="button"
              className="group flex flex-col items-center justify-center gap-0.5 text-tertiary"
              aria-label={t("aria_labels.projects_sidebar.open_user_menu")}
            >
              <AppSidebarItem.Icon
                icon={
                  <Avatar
                    alt={currentUser?.display_name}
                    fallback={currentUser?.display_name?.[0]?.toUpperCase()}
                    src={getFileURL(currentUser?.avatar_url ?? "")}
                    size="xs"
                  />
                }
                highlight={isUserMenuOpen}
              />
            </button>
          }
        />
        <MenuContent side="bottom" align="end">
          <div className="flex w-72 max-w-full flex-col gap-y-3 p-2">
            <div className="relative h-29 w-full rounded-lg">
              <CoverImage
                src={currentUser?.cover_image_url ?? undefined}
                alt={currentUser?.display_name}
                className="h-29 w-full rounded-lg"
                showDefaultWhenEmpty
              />
              <div className="absolute inset-0 bg-layer-1/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center gap-y-2">
                  <div>
                    <Avatar
                      alt={currentUser?.display_name}
                      fallback={currentUser?.display_name?.[0]?.toUpperCase()}
                      src={getFileURL(currentUser?.avatar_url ?? "")}
                      size="xl"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-body-sm-medium">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </p>
                    <p className="text-caption-md-regular">{currentUser?.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
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
                icon={<Icon icon={SettingsOutline} />}
                label={t("preferences")}
                onClick={() =>
                  toggleProfileSettingsModal({
                    activeTab: "preferences",
                    isOpen: true,
                  })
                }
              />
            </div>
            <div>
              <MenuItem icon={<Icon icon={LogOutOutline} />} label={t("sign_out")} onClick={handleSignOut} />
              {isUserInstanceAdmin && (
                <MenuItem variant="accent" label={t("enter_god_mode")} onClick={() => router.push(GOD_MODE_URL)} />
              )}
            </div>
          </div>
        </MenuContent>
      </Menu>
    </div>
  );
});

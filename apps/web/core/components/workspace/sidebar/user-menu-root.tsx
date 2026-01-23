import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Settings2 } from "lucide-react";
// plane imports
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar, CustomMenu } from "@plane/ui";
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
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  // Toggle sidebar dropdown state when menu is open
  useEffect(() => {
    if (isUserMenuOpen) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isUserMenuOpen, toggleAnySidebarDropdown]);

  return (
    <CustomMenu
      className="flex items-center"
      customButton={
        <AppSidebarItem
          variant="button"
          item={{
            icon: (
              <Avatar
                name={currentUser?.display_name}
                src={getFileURL(currentUser?.avatar_url ?? "")}
                size={20}
                shape="circle"
              />
            ),
            isActive: isUserMenuOpen,
          }}
        />
      }
      menuButtonOnClick={() => !isUserMenuOpen && setIsUserMenuOpen(true)}
      onMenuClose={() => setIsUserMenuOpen(false)}
      placement="bottom-end"
      maxHeight="2xl"
      optionsClassName="w-72 p-3 flex flex-col gap-y-3"
      closeOnSelect
    >
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
                name={currentUser?.display_name}
                src={getFileURL(currentUser?.avatar_url ?? "")}
                size={40}
                shape="circle"
                className="text-18 font-medium"
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
        <CustomMenu.MenuItem
          onClick={() =>
            toggleProfileSettingsModal({
              activeTab: "general",
              isOpen: true,
            })
          }
          className="flex items-center gap-2"
        >
          <Settings className="shrink-0 size-3.5" />
          {t("settings")}
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={() =>
            toggleProfileSettingsModal({
              activeTab: "preferences",
              isOpen: true,
            })
          }
          className="flex items-center gap-2"
        >
          <Settings2 className="shrink-0 size-3.5" />
          {t("preferences")}
        </CustomMenu.MenuItem>
      </div>
      <CustomMenu.MenuItem onClick={handleSignOut} className="flex items-center gap-2">
        <LogOut className="shrink-0 size-3.5" />
        {t("sign_out")}
      </CustomMenu.MenuItem>
      {isUserInstanceAdmin && (
        <CustomMenu.MenuItem
          onClick={() => router.push(GOD_MODE_URL)}
          className="bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 hover:text-accent-secondary"
        >
          {t("enter_god_mode")}
        </CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
});

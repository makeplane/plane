import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// icons
import { LogOut, Settings, Settings2 } from "lucide-react";
// plane imports
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar, CustomMenu } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUser } from "@/hooks/store/user";

type Props = {
  size?: "xs" | "sm" | "md";
};

export const UserMenuRoot = observer(function UserMenuRoot(props: Props) {
  const { size = "sm" } = props;
  const { workspaceSlug } = useParams();
  // router
  const router = useRouter();
  // store hooks
  const { toggleAnySidebarDropdown } = useAppTheme();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  // derived values
  const isUserInstanceAdmin = false;
  // translation
  const { t } = useTranslation();
  // local state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut().catch(() =>
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
  }, [isUserMenuOpen]);

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
                size={size === "xs" ? 20 : size === "sm" ? 24 : 28}
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
      maxHeight="lg"
      closeOnSelect
    >
      <div className="flex flex-col gap-2">
        <span className="px-2 text-secondary truncate">{currentUser?.email}</span>
        <CustomMenu.MenuItem onClick={() => router.push(`/${workspaceSlug}/settings/account`)}>
          <div className="flex w-full items-center gap-2 rounded-sm text-11">
            <Settings className="h-4 w-4 stroke-[1.5]" />
            <span>{t("settings")}</span>
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={() => router.push(`/${workspaceSlug}/settings/account/preferences`)}>
          <div className="flex w-full items-center gap-2 rounded-sm text-11">
            <Settings2 className="h-4 w-4 stroke-[1.5]" />
            <span>Preferences</span>
          </div>
        </CustomMenu.MenuItem>
      </div>
      <div className="my-1 border-t border-subtle" />
      <div className={`${isUserInstanceAdmin ? "pb-2" : ""}`}>
        <CustomMenu.MenuItem>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm text-11 hover:bg-layer-1"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 stroke-[1.5]" />
            {t("sign_out")}
          </button>
        </CustomMenu.MenuItem>
      </div>
      {isUserInstanceAdmin && (
        <>
          <div className="my-1 border-t border-subtle" />
          <div className="px-1">
            <CustomMenu.MenuItem onClick={() => router.push(GOD_MODE_URL)}>
              <div className="flex w-full items-center justify-center rounded-sm bg-accent-primary/20 px-2 py-1 text-11 font-medium text-accent-primary hover:bg-accent-primary/30 hover:text-accent-secondary">
                {t("enter_god_mode")}
              </div>
            </CustomMenu.MenuItem>
          </div>
        </>
      )}
    </CustomMenu>
  );
});

"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// icons
import { LogOut, PanelLeftDashed, Settings } from "lucide-react";
// plane imports
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Avatar, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useAppTheme, useUser } from "@/hooks/store";
import { useAppRail } from "@/hooks/use-app-rail";

type Props = {
  size?: "sm" | "md";
};

export const UserMenuRoot = observer((props: Props) => {
  const { size = "sm" } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleAnySidebarDropdown, sidebarPeek, toggleSidebarPeek } = useAppTheme();

  const { isEnabled, shouldRenderAppRail, toggleAppRail } = useAppRail();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  // derived values

  const isUserInstanceAdmin = false;
  // translation
  const { t } = useTranslation();
  // local state

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (open) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  };

  return (
    <CustomMenu
      className="relative flex-shrink-0"
      handleOpenChange={handleOpenChange}
      customButtonClassName="grid place-items-center outline-none"
      optionsClassName="px-1 py-2"
      customButton={
        <Avatar
          name={currentUser?.display_name}
          src={getFileURL(currentUser?.avatar_url ?? "")}
          size={size === "sm" ? 24 : 28}
          shape="circle"
          className="!text-base"
        />
      }
    >
      <>
        <div className="flex flex-col gap-2.5 pb-2 border-b border-custom-border-100">
          <span className="px-2 text-custom-sidebar-text-200 truncate">{currentUser?.email}</span>
          <Link href={`/${workspaceSlug}/settings/account`}>
            <CustomMenu.MenuItem className="flex gap-2">
              <Settings className="h-4 w-4 stroke-[1.5]" />
              <span>{t("settings")}</span>
            </CustomMenu.MenuItem>
          </Link>
          {isEnabled && (
            <CustomMenu.MenuItem
              className="flex w-full items-center gap-2 rounded hover:bg-custom-sidebar-background-80"
              onClick={() => {
                if (sidebarPeek) toggleSidebarPeek(false);
                toggleAppRail();
              }}
            >
              <PanelLeftDashed className="h-4 w-4 stroke-[1.5]" />
              <span>{shouldRenderAppRail ? "Undock AppRail" : "Dock AppRail"}</span>
            </CustomMenu.MenuItem>
          )}
        </div>
        <div className={`pt-2 ${isUserInstanceAdmin || false ? "pb-2" : ""}`}>
          <CustomMenu.MenuItem
            className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 stroke-[1.5]" />
            {t("sign_out")}
          </CustomMenu.MenuItem>
        </div>
        {isUserInstanceAdmin && (
          <div className="p-2 pb-0">
            <Link href={GOD_MODE_URL}>
              <CustomMenu.MenuItem className="w-full">
                <span className="flex w-full items-center justify-center rounded bg-custom-primary-100/20 px-2 py-1 text-sm font-medium text-custom-primary-100 hover:bg-custom-primary-100/30 hover:text-custom-primary-200">
                  {t("enter_god_mode")}
                </span>
              </CustomMenu.MenuItem>
            </Link>
          </div>
        )}
      </>
    </CustomMenu>
  );
});

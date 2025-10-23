"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { HelpCircle, MessagesSquare, MoveLeft, User } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { PageIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ProductUpdatesModal } from "@/components/global";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useInstance } from "@/hooks/store/use-instance";
import { useTransient } from "@/hooks/store/use-transient";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";
import { WorkspaceEditionBadge } from "@/plane-web/components/workspace/edition-badge";

export interface WorkspaceHelpSectionProps {
  setSidebarActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SidebarHelpSection: React.FC<WorkspaceHelpSectionProps> = observer(() => {
  // store hooks
  const { t } = useTranslation();
  const { sidebarCollapsed: isCollapsed, toggleSidebar, sidebarPeek, toggleSidebarPeek } = useAppTheme();
  const { toggleShortcutModal } = useCommandPalette();
  const { isMobile } = usePlatformOS();
  const { config } = useInstance();
  const { isIntercomToggle, toggleIntercom } = useTransient();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [isProductUpdatesModalOpen, setProductUpdatesModalOpen] = useState(false);

  const handleCrispWindowShow = () => {
    toggleIntercom(!isIntercomToggle);
  };

  return (
    <>
      <ProductUpdatesModal isOpen={isProductUpdatesModalOpen} handleClose={() => setProductUpdatesModalOpen(false)} />
      <div className="flex w-full items-center justify-between px-2 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12 flex-shrink-0">
        <div className="relative flex flex-shrink-0 items-center gap-1 justify-evenly">
          <CustomMenu
            customButton={
              <div
                className={cn(
                  "grid place-items-center rounded-md p-1 outline-none text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90",
                  {
                    "bg-custom-background-90": isNeedHelpOpen,
                  }
                )}
              >
                <Tooltip tooltipContent="Help" isMobile={isMobile} disabled={isNeedHelpOpen}>
                  <HelpCircle className="h-[18px] w-[18px] outline-none" />
                </Tooltip>
              </div>
            }
            customButtonClassName="relative grid place-items-center rounded-md p-1.5 outline-none"
            menuButtonOnClick={() => !isNeedHelpOpen && setIsNeedHelpOpen(true)}
            onMenuClose={() => setIsNeedHelpOpen(false)}
            placement="top-end"
            maxHeight="lg"
            closeOnSelect
          >
            <CustomMenu.MenuItem onClick={() => window.open("https://go.plane.so/p-docs", "_blank")}>
              <div className="flex items-center gap-x-2 rounded text-xs">
                <PageIcon className="h-3.5 w-3.5 text-custom-text-200" height={14} width={14} />
                <span className="text-xs">{t("documentation")}</span>
              </div>
            </CustomMenu.MenuItem>
            {config?.intercom_app_id && config?.is_intercom_enabled && (
              <CustomMenu.MenuItem>
                <button
                  type="button"
                  onClick={handleCrispWindowShow}
                  className="flex w-full items-center gap-x-2 rounded text-xs hover:bg-custom-background-80"
                >
                  <MessagesSquare className="h-3.5 w-3.5 text-custom-text-200" />
                  <span className="text-xs">{t("message_support")}</span>
                </button>
              </CustomMenu.MenuItem>
            )}
            <CustomMenu.MenuItem onClick={() => window.open("mailto:sales@plane.so", "_blank")}>
              <div className="flex items-center gap-x-2 rounded text-xs">
                <User className="h-3.5 w-3.5 text-custom-text-200" size={14} />
                <span className="text-xs">{t("contact_sales")}</span>
              </div>
            </CustomMenu.MenuItem>
            <div className="my-1 border-t border-custom-border-200" />
            <CustomMenu.MenuItem>
              <button
                type="button"
                onClick={() => toggleShortcutModal(true)}
                className="flex w-full items-center justify-start text-xs hover:bg-custom-background-80"
              >
                <span className="text-xs">{t("keyboard_shortcuts")}</span>
              </button>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem>
              <button
                type="button"
                onClick={() => setProductUpdatesModalOpen(true)}
                className="flex w-full items-center justify-start text-xs hover:bg-custom-background-80"
              >
                <span className="text-xs">{t("whats_new")}</span>
              </button>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={() => window.open("https://go.plane.so/p-discord", "_blank")}>
              <div className="flex items-center gap-x-2 rounded text-xs">
                <span className="text-xs">Discord</span>
              </div>
            </CustomMenu.MenuItem>
            <div className="px-1 pt-2 mt-1 text-xs text-custom-text-200 border-t border-custom-border-200">
              <PlaneVersionNumber />
            </div>
          </CustomMenu>
        </div>
        <div className="w-full flex-grow px-0.5">
          <WorkspaceEditionBadge />
        </div>
        <div className="flex flex-shrink-0 items-center gap-1 justify-evenly">
          <Tooltip tooltipContent={`${isCollapsed ? "Expand" : "Hide"}`} isMobile={isMobile}>
            <button
              type="button"
              className="grid place-items-center rounded-md p-1 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100"
              onClick={() => {
                if (sidebarPeek) toggleSidebarPeek(false);
                toggleSidebar();
              }}
              aria-label={t(
                isCollapsed
                  ? "aria_labels.projects_sidebar.expand_sidebar"
                  : "aria_labels.projects_sidebar.collapse_sidebar"
              )}
            >
              <MoveLeft className={`size-4 duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
});

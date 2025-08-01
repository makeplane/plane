"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText, HelpCircle, MessagesSquare, MoveLeft, User } from "lucide-react";
// ui
import { CustomMenu, Tooltip, ToggleSwitch } from "@plane/ui";
// components
import { ProductUpdatesModal } from "@/components/global";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette, useInstance, useTransient, useUserSettings } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";
import { ENABLE_LOCAL_DB_CACHE } from "@/plane-web/constants/issues";
import { useTranslation } from "@plane/i18n";

export interface WorkspaceHelpSectionProps {
  setSidebarActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SidebarHelpSection: React.FC<WorkspaceHelpSectionProps> = observer(() => {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { toggleShortcutModal } = useCommandPalette();
  const { isMobile } = usePlatformOS();
  const { config } = useInstance();
  const { isIntercomToggle, toggleIntercom } = useTransient();
  const { canUseLocalDB, toggleLocalDB } = useUserSettings();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false);

  const handleCrispWindowShow = () => {
    toggleIntercom(!isIntercomToggle);
  };

  const isCollapsed = sidebarCollapsed || false;

  return (
    <>
      <ProductUpdatesModal isOpen={isChangeLogOpen} handleClose={() => setIsChangeLogOpen(false)} />
      <div
        className={cn(
          "flex w-full items-center justify-between px-2 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12 flex-shrink-0",
          {
            "flex-col h-auto py-1.5": isCollapsed,
          }
        )}
      >
        
        <div
          className={`flex flex-shrink-0 items-center gap-1 ${isCollapsed ? "flex-col justify-center" : "justify-end ml-auto"}`}
        >
          <Tooltip tooltipContent={`${isCollapsed ? t("expand") : t("hide")}`} isMobile={isMobile}>
            <button
              type="button"
              className={`grid place-items-center rounded-md p-1 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${isCollapsed ? "w-full" : ""
                }`}
              onClick={() => toggleSidebar()}
            >
              <MoveLeft className={`h-4 w-4 duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
});

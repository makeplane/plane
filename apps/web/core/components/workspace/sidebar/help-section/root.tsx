"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { HelpCircle, MessagesSquare, User } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { PageIcon } from "@plane/propel/icons";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useInstance } from "@/hooks/store/use-instance";
import { useTransient } from "@/hooks/store/use-transient";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

export const HelpMenuRoot = observer(() => {
  // store hooks
  const { t } = useTranslation();
  const { toggleShortcutModal } = useCommandPalette();
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

      <CustomMenu
        customButton={
          <AppSidebarItem
            variant="button"
            item={{
              icon: <HelpCircle className="size-5" />,
              isActive: isNeedHelpOpen,
            }}
          />
        }
        // customButtonClassName="relative grid place-items-center rounded-md p-1.5 outline-none"
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
        <CustomMenu.MenuItem
          onClick={() => window.open("https://go.plane.so/p-discord", "_blank", "noopener,noreferrer")}
        >
          <div className="flex items-center gap-x-2 rounded text-xs">
            <span className="text-xs">Discord</span>
          </div>
        </CustomMenu.MenuItem>
        <div className="px-1 pt-2 mt-1 text-xs text-custom-text-200 border-t border-custom-border-200">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

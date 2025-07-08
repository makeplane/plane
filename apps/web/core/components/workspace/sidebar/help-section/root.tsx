"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText, HelpCircle, MessagesSquare, User } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { CustomMenu, ToggleSwitch } from "@plane/ui";
// components
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar";
// hooks
import { useCommandPalette, useInstance, useTransient, useUserSettings } from "@/hooks/store";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

export const HelpMenuRoot = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { toggleShortcutModal } = useCommandPalette();
  const { config } = useInstance();
  const { isIntercomToggle, toggleIntercom } = useTransient();
  const { canUseLocalDB, toggleLocalDB } = useUserSettings();
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
        <CustomMenu.MenuItem>
          <a
            href="https://go.plane.so/p-docs"
            target="_blank"
            className="flex items-center justify- gap-x-2 rounded text-xs hover:bg-custom-background-80"
          >
            <FileText className="h-3.5 w-3.5 text-custom-text-200" size={14} />
            <span className="text-xs">{t("documentation")}</span>
          </a>
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
        <CustomMenu.MenuItem>
          <a
            href="mailto:sales@plane.so"
            target="_blank"
            className="flex items-center justify- gap-x-2 rounded text-xs hover:bg-custom-background-80"
          >
            <User className="h-3.5 w-3.5 text-custom-text-200" size={14} />
            <span className="text-xs">{t("contact_sales")}</span>
          </a>
        </CustomMenu.MenuItem>
        <div className="my-1 border-t border-custom-border-200" />
        <CustomMenu.MenuItem>
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex w-full items-center justify-between text-xs hover:bg-custom-background-80"
          >
            <span className="racking-tight">{t("hyper_mode")}</span>
            <ToggleSwitch
              value={canUseLocalDB}
              onChange={() => toggleLocalDB(workspaceSlug?.toString(), projectId?.toString())}
            />
          </div>
        </CustomMenu.MenuItem>
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
        <CustomMenu.MenuItem>
          <a
            href="https://go.plane.so/p-discord"
            target="_blank"
            className="flex items-center justify- gap-x-2 rounded text-xs hover:bg-custom-background-80"
          >
            <span className="text-xs">Discord</span>
          </a>
        </CustomMenu.MenuItem>
        <div className="px-1 pt-2 mt-1 text-xs text-custom-text-200 border-t border-custom-border-200">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

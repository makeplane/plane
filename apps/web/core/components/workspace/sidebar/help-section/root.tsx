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
import { usePowerK } from "@/hooks/store/use-power-k";
import { useChatSupport } from "@/hooks/use-chat-support";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  // store hooks
  const { t } = useTranslation();
  const { toggleShortcutsListModal } = usePowerK();
  const { openChatSupport, isEnabled: isChatSupportEnabled } = useChatSupport();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [isProductUpdatesModalOpen, setProductUpdatesModalOpen] = useState(false);

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
        placement="bottom-end"
        maxHeight="lg"
        closeOnSelect
      >
        <CustomMenu.MenuItem onClick={() => window.open("https://go.plane.so/p-docs", "_blank")}>
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <PageIcon className="h-3.5 w-3.5 text-secondary" height={14} width={14} />
            <span className="text-11">{t("documentation")}</span>
          </div>
        </CustomMenu.MenuItem>
        {isChatSupportEnabled && (
          <CustomMenu.MenuItem>
            <button
              type="button"
              onClick={openChatSupport}
              className="flex w-full items-center gap-x-2 rounded-sm text-11 hover:bg-layer-1"
            >
              <MessagesSquare className="h-3.5 w-3.5 text-secondary" />
              <span className="text-11">{t("message_support")}</span>
            </button>
          </CustomMenu.MenuItem>
        )}
        <CustomMenu.MenuItem onClick={() => window.open("mailto:sales@plane.so", "_blank")}>
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <User className="h-3.5 w-3.5 text-secondary" size={14} />
            <span className="text-11">{t("contact_sales")}</span>
          </div>
        </CustomMenu.MenuItem>
        <div className="my-1 border-t border-subtle" />
        <CustomMenu.MenuItem>
          <button
            type="button"
            onClick={() => toggleShortcutsListModal(true)}
            className="flex w-full items-center justify-sbg-layer-211 hover:bg-layer-1"
          >
            <span className="text-11">{t("keyboard_shortcuts")}</span>
          </button>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem>
          <button
            type="button"
            onClick={() => setProductUpdatesModalOpen(true)}
            className="flex w-full items-center justify-sbg-layer-211 hover:bg-layer-1"
          >
            <span className="text-11">{t("whats_new")}</span>
          </button>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={() => window.open("https://go.plane.so/p-discord", "_blank", "noopener,noreferrer")}
        >
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <span className="text-11">Discord</span>
          </div>
        </CustomMenu.MenuItem>
        <div className="px-1 pt-2 mt-1 text-11 text-secondary border-t border-subtle">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

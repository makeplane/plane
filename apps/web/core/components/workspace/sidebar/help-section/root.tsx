/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { HelpCircle, LifeBuoy, MessagesSquare, Sparkles, User } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { ContactPointModal } from "./contact-point-modal";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useUserProfile } from "@/hooks/store/user";
import { useChatSupport } from "@/hooks/use-chat-support";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  // store hooks
  const { t } = useTranslation();
  const router = useRouter();
  const { workspaceSlug } = useParams();
  usePowerK();
  const { openChatSupport, isEnabled: isChatSupportEnabled } = useChatSupport();
  const { restartTour } = useUserProfile();

  const handleStartProductTour = async () => {
    try {
      await restartTour();
      if (workspaceSlug) {
        router.push(`/${workspaceSlug.toString()}/`);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("start_product_tour_error"),
      });
    }
  };
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [isProductUpdatesModalOpen, setProductUpdatesModalOpen] = useState(false);
  const [isContactPointOpen, setIsContactPointOpen] = useState(false);

  return (
    <>
      <ProductUpdatesModal isOpen={isProductUpdatesModalOpen} handleClose={() => setProductUpdatesModalOpen(false)} />
      <ContactPointModal isOpen={isContactPointOpen} handleClose={() => setIsContactPointOpen(false)} />

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
        {/* Help Center replaces the former (dead) self-hosted /docs link — it IS the
            self-hosted guide. Routes to the instance-global reader. */}
        <CustomMenu.MenuItem onClick={() => router.push("/help")}>
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <LifeBuoy className="h-3.5 w-3.5 text-secondary" />
            <span className="text-11">{t("help_center.menu_label")}</span>
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
        <CustomMenu.MenuItem onClick={() => handleStartProductTour()}>
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <Sparkles className="h-3.5 w-3.5 text-secondary" size={14} />
            <span className="text-11">{t("start_product_tour")}</span>
          </div>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem onClick={() => setIsContactPointOpen(true)}>
          <div className="flex items-center gap-x-2 rounded-sm text-11">
            <User className="h-3.5 w-3.5 text-secondary" size={14} />
            <span className="text-11">{t("contact_point")}</span>
          </div>
        </CustomMenu.MenuItem>
        <div className="my-1 border-t border-subtle" />
        {/* <CustomMenu.MenuItem>
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
        </CustomMenu.MenuItem>*/}
        <div className="px-1 pt-2 mt-1 text-11 text-secondary border-t border-subtle">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

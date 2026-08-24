/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { HelpCircle, User } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { PageIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { PlaneVersionNumber } from "@/components/global/version-number";
import { usePowerK } from "@/hooks/store/use-power-k";
import { useBrand } from "@/hooks/use-brand";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  const { t } = useTranslation();
  const { toggleShortcutsListModal } = usePowerK();
  const { supportEmail, hidePlaneMarketing } = useBrand();
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
        menuButtonOnClick={() => !isNeedHelpOpen && setIsNeedHelpOpen(true)}
        onMenuClose={() => setIsNeedHelpOpen(false)}
        placement="bottom-end"
        maxHeight="lg"
        closeOnSelect
      >
        {!hidePlaneMarketing && (
          <CustomMenu.MenuItem onClick={() => window.open("https://go.plane.so/p-docs", "_blank")}>
            <div className="flex items-center gap-x-2 rounded-sm text-11">
              <PageIcon className="h-3.5 w-3.5 text-secondary" height={14} width={14} />
              <span className="text-11">{t("documentation")}</span>
            </div>
          </CustomMenu.MenuItem>
        )}
        {!hidePlaneMarketing && (
          <CustomMenu.MenuItem onClick={() => window.open("mailto:sales@plane.so", "_blank")}>
            <div className="flex items-center gap-x-2 rounded-sm text-11">
              <User className="h-3.5 w-3.5 text-secondary" size={14} />
              <span className="text-11">{t("contact_sales")}</span>
            </div>
          </CustomMenu.MenuItem>
        )}
        {hidePlaneMarketing && (
          <CustomMenu.MenuItem onClick={() => window.open(`mailto:${supportEmail}`, "_blank")}>
            <div className="flex items-center gap-x-2 rounded-sm text-11">
              <User className="h-3.5 w-3.5 text-secondary" size={14} />
              <span className="text-11">{t("support")}</span>
            </div>
          </CustomMenu.MenuItem>
        )}
        <div className="my-1 border-t border-subtle" />
        <CustomMenu.MenuItem>
          <button
            type="button"
            onClick={() => toggleShortcutsListModal(true)}
            className="justify-sbg-layer-211 flex w-full items-center hover:bg-layer-1"
          >
            <span className="text-11">{t("keyboard_shortcuts")}</span>
          </button>
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem>
          <button
            type="button"
            onClick={() => setProductUpdatesModalOpen(true)}
            className="justify-sbg-layer-211 flex w-full items-center hover:bg-layer-1"
          >
            <span className="text-11">{t("whats_new")}</span>
          </button>
        </CustomMenu.MenuItem>
        {!hidePlaneMarketing && (
          <CustomMenu.MenuItem onClick={() => window.open("https://forum.plane.so", "_blank", "noopener,noreferrer")}>
            <div className="flex items-center gap-x-2 rounded-sm text-11">
              <span className="text-11">Forum</span>
            </div>
          </CustomMenu.MenuItem>
        )}
        <div className="mt-1 border-t border-subtle px-1 pt-2 text-11 text-secondary">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

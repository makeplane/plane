/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { HelpOutline, PagesOutline, UserOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// ui
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
// components
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { PlaneVersionNumber } from "@/components/global/version-number";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  // store hooks
  const { t } = useTranslation();
  const { toggleShortcutsListModal } = usePowerK();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  const [isProductUpdatesModalOpen, setProductUpdatesModalOpen] = useState(false);

  return (
    <>
      <ProductUpdatesModal isOpen={isProductUpdatesModalOpen} handleClose={() => setProductUpdatesModalOpen(false)} />

      <Menu onOpenChange={setIsNeedHelpOpen}>
        {/* propel: `AppSidebarItem` takes no arbitrary props, so it cannot be the Base UI trigger
            — the popup would have no element to anchor to. The trigger is a plain button wearing
            the same chrome, with the item's own icon part inside it. */}
        <MenuTrigger
          render={
            <button
              type="button"
              className="group flex flex-col items-center justify-center gap-0.5 text-tertiary"
              aria-label={t("power_k.group_titles.help")}
            >
              <AppSidebarItem.Icon icon={<HelpOutline className="size-5" />} highlight={isNeedHelpOpen} />
            </button>
          }
        />
        <MenuContent
          side="bottom"
          align="end"
          footer={
            <div className="text-11 text-secondary">
              <PlaneVersionNumber />
            </div>
          }
        >
          <MenuItem
            icon={<Icon icon={PagesOutline} tint="secondary" />}
            label={t("documentation")}
            onClick={() => window.open("https://go.plane.so/p-docs", "_blank")}
          />
          <MenuItem
            icon={<Icon icon={UserOutline} tint="secondary" />}
            label={t("contact_sales")}
            onClick={() => window.open("mailto:sales@plane.so", "_blank")}
          />
          <MenuSeparator />
          <MenuItem label={t("keyboard_shortcuts")} onClick={() => toggleShortcutsListModal(true)} />
          <MenuItem label={t("whats_new")} onClick={() => setProductUpdatesModalOpen(true)} />
          <MenuItem
            label="Forum"
            onClick={() => window.open("https://forum.plane.so", "_blank", "noopener,noreferrer")}
          />
        </MenuContent>
      </Menu>
    </>
  );
});

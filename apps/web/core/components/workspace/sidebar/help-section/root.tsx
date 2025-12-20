import { useState } from "react";
import { observer } from "mobx-react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { ProductUpdatesModal } from "@/components/global";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

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
        <div className="px-1 pt-2 mt-1 text-11 text-secondary border-t border-subtle">
          <PlaneVersionNumber />
        </div>
      </CustomMenu>
    </>
  );
});

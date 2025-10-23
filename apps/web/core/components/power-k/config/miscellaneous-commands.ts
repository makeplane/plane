import { useCallback } from "react";
import { Link, PanelLeft } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const usePowerKMiscellaneousCommands = (): TPowerKCommandConfig[] => {
  // store hooks
  const { toggleSidebar } = useAppTheme();
  // translation
  const { t } = useTranslation();

  const copyPageUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.miscellaneous_actions.copy_page_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.miscellaneous_actions.copy_page_url_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "toggle_app_sidebar",
      group: "miscellaneous",
      type: "action",
      i18n_title: "power_k.miscellaneous_actions.toggle_app_sidebar",
      icon: PanelLeft,
      action: () => toggleSidebar(),
      modifierShortcut: "cmd+b",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "copy_page_url",
      group: "miscellaneous",
      type: "action",
      i18n_title: "power_k.miscellaneous_actions.copy_page_url",
      icon: Link,
      action: copyPageUrlToClipboard,
      modifierShortcut: "cmd+shift+c",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};

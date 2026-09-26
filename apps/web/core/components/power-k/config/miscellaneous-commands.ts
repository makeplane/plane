/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { LeftSidePaneOutline, LinkOutline, SearchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePowerK } from "@/hooks/store/use-power-k";

export const usePowerKMiscellaneousCommands = (): TPowerKCommandConfig[] => {
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { topNavInputRef } = usePowerK();
  // translation
  const { t } = useTranslation();

  const copyCurrentPageUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      // oxlint-disable-next-line promise/always-return
      .then(() => {
        setToast({
          type: "success",
          title: t("power_k.miscellaneous_actions.copy_current_page_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: "error",
          title: t("power_k.miscellaneous_actions.copy_current_page_url_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusTopNavSearch = useCallback(() => {
    topNavInputRef?.current?.focus();
  }, [topNavInputRef]);
  // Without a mounted top-nav input the command has nothing to focus, and Cmd+F must fall
  // through to the browser's Find
  const hasTopNavInput = useCallback(() => Boolean(topNavInputRef?.current), [topNavInputRef]);

  return [
    {
      id: "toggle_app_sidebar",
      group: "miscellaneous",
      type: "action",
      i18n_title: "power_k.miscellaneous_actions.toggle_app_sidebar",
      icon: LeftSidePaneOutline,
      action: () => toggleSidebar(),
      modifierShortcut: "cmd+b",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "copy_current_page_url",
      group: "miscellaneous",
      type: "action",
      i18n_title: "power_k.miscellaneous_actions.copy_current_page_url",
      icon: LinkOutline,
      action: copyCurrentPageUrlToClipboard,
      modifierShortcut: "cmd+shift+c",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "focus_top_nav_search",
      group: "miscellaneous",
      type: "action",
      i18n_title: "power_k.miscellaneous_actions.focus_top_nav_search",
      icon: SearchOutline,
      action: focusTopNavSearch,
      modifierShortcut: "cmd+f",
      isEnabled: hasTopNavInput,
      isVisible: hasTopNavInput,
      closeOnSelect: true,
    },
  ];
};

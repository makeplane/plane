/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { LeftSidePaneOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

export const AppSidebarToggleButton = observer(function AppSidebarToggleButton() {
  // store hooks
  const { sidebarCollapsed, toggleSidebar, sidebarPeek, toggleSidebarPeek } = useAppTheme();
  // plane hooks
  const { t } = useTranslation();

  return (
    <IconButton
      size="sm"
      variant="ghost"
      icon={<Icon icon={LeftSidePaneOutline} />}
      aria-label={t(
        sidebarCollapsed
          ? "aria_labels.projects_sidebar.expand_sidebar"
          : "aria_labels.projects_sidebar.collapse_sidebar"
      )}
      onClick={() => {
        if (sidebarPeek) toggleSidebarPeek(false);
        toggleSidebar();
      }}
    />
  );
});

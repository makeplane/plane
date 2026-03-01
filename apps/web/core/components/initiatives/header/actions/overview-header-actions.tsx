/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
import { cn } from "@plane/utils";
import { IconButton } from "@plane/propel/icon-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const InitiativeOverviewHeaderActions = observer(function InitiativeOverviewHeaderActions() {
  const { initiativesSidebarCollapsed, toggleInitiativesSidebar } = useAppTheme();
  return (
    <IconButton
      variant="tertiary"
      size="lg"
      icon={PanelRight}
      onClick={() => toggleInitiativesSidebar()}
      className={cn({
        "text-accent-primary bg-accent-subtle": !initiativesSidebarCollapsed,
      })}
    />
  );
});

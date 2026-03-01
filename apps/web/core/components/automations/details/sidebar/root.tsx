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
// plane imports
import { cn } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarContent } from "./content";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarRoot = observer(function AutomationDetailsSidebarRoot(props: Props) {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const { sidebarHelper } = getAutomationById(automationId) ?? {};
  const selectedSidebarTab = sidebarHelper?.selectedSidebarConfig?.tab;

  return (
    <aside
      className={cn(
        "flex-shrink-0 h-full w-[400px] -mr-[400px] flex flex-col bg-surface-1 border-l border-subtle-1 space-y-6 overflow-y-scroll vertical-scrollbar scrollbar-sm transition-all",
        {
          "mr-0": !!selectedSidebarTab,
        }
      )}
    >
      <AutomationDetailsSidebarContent automationId={automationId} />
    </aside>
  );
});

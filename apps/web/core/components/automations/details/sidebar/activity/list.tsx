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
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityListItem } from "./list-item";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActivityList = observer(function AutomationDetailsSidebarActivityList(
  props: Props
) {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const { activityIds } = automation?.activity ?? {};

  return (
    <div className="px-4">
      {activityIds?.map((activityId) => (
        <AutomationDetailsSidebarActivityListItem
          key={activityId}
          activityId={activityId}
          automationId={automationId}
        />
      ))}
    </div>
  );
});

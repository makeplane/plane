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

import { useRef } from "react";
import { observer } from "mobx-react";
// plane hooks
import { usePlatformOS } from "@plane/hooks";
// components
import { ListItem } from "@/components/core/list";
// plane web store
import type { IDashboardInstance } from "@/store/dashboards/dashboard";
// local components
import { DashboardListItemActions } from "./list-item-actions";

type Props = {
  getDashboardDetails: (dashboardId: string) => IDashboardInstance | undefined;
  id: string;
};

export const DashboardListItem = observer(function DashboardListItem(props: Props) {
  const { getDashboardDetails, id } = props;
  // refs
  const parentRef = useRef(null);
  // platform check
  const { isMobile } = usePlatformOS();
  // derived values
  const dashboard = getDashboardDetails(id);

  if (!dashboard) return null;

  const { getRedirectionLink } = dashboard;

  return (
    <ListItem
      title={dashboard.name ?? ""}
      itemLink={getRedirectionLink()}
      actionableItems={<DashboardListItemActions dashboard={dashboard} parentRef={parentRef} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});

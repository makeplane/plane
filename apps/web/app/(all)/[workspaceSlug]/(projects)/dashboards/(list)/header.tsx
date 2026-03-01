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
// plane ui
import { Button } from "@plane/propel/button";
import { DashboardIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// plane web components
import { DashboardsListSearch } from "@/components/dashboards/list/search";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

export const WorkspaceDashboardsListHeader = observer(function WorkspaceDashboardsListHeader() {
  // store hooks
  const {
    workspaceDashboards: { canCurrentUserCreateDashboard, toggleCreateUpdateModal, searchQuery, updateSearchQuery },
  } = useDashboards();

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label="Dashboards" icon={<DashboardIcon className="size-4 text-tertiary" />} />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <DashboardsListSearch value={searchQuery} onChange={updateSearchQuery} />
        {canCurrentUserCreateDashboard && (
          <Button variant="primary" size="lg" onClick={() => toggleCreateUpdateModal(true)}>
            Add dashboard
          </Button>
        )}
      </Header.RightItem>
    </Header>
  );
});

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
import { Outlet } from "react-router";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { CustomerUpgrade } from "@/components/customers";
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { useCustomers } from "@/plane-web/hooks/store";
// types
import type { Route } from "./+types/layout";

function CustomersLayout({ params }: Route.ComponentProps) {
  // hooks
  const { loader, isCustomersFeatureEnabled } = useCustomers();
  // derived values
  const shouldUpgrade =
    isCustomersFeatureEnabled !== undefined && isCustomersFeatureEnabled === false && loader !== "init-loader";

  return (
    <WorkspaceAccessWrapper pageKey="customers" workspaceSlug={params.workspaceSlug}>
      {shouldUpgrade ? (
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
          <CustomerUpgrade />
        </div>
      ) : (
        <>
          <Outlet />
          <IssuePeekOverview />
          <EpicPeekOverview />
        </>
      )}
    </WorkspaceAccessWrapper>
  );
}

export default observer(CustomersLayout);

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
import useSWR from "swr";
// hooks
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// types
import type { Route } from "./+types/layout";

function RecurringWorkItemsProjectSettingsLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { fetchRecurringWorkItems } = useRecurringWorkItems();
  // derived values
  const isRecurringWorkItemsEnabled = useFlag(workspaceSlug, "RECURRING_WORKITEMS");

  // fetching recurring work items
  useSWR(
    isRecurringWorkItemsEnabled ? ["recurringWorkItems", workspaceSlug, projectId, isRecurringWorkItemsEnabled] : null,
    isRecurringWorkItemsEnabled ? () => fetchRecurringWorkItems(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return <Outlet />;
}

export default observer(RecurringWorkItemsProjectSettingsLayout);

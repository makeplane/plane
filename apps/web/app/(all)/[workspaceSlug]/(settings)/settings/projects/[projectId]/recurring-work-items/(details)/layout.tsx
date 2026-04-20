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
import Link from "next/link";
import { Outlet } from "react-router";
import { ChevronLeftIcon } from "lucide-react";
// plane imports
import { getRecurringWorkItemSettingsPath } from "@plane/utils";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import type { Route } from "./+types/layout";
import { RecurringWorkItemsProjectSettingsHeader } from "../header";

function RecurringWorkItemsDetailsLayout({ params }: Route.ComponentProps) {
  // router params
  const { workspaceSlug, projectId } = params;

  return (
    <SettingsContentWrapper header={<RecurringWorkItemsProjectSettingsHeader />}>
      <div className="w-full h-full">
        <Link
          href={getRecurringWorkItemSettingsPath({ workspaceSlug, projectId })}
          className="flex items-center gap-2 text-13 font-semibold text-tertiary mb-6"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <div>Back to recurring work items</div>
        </Link>
        <div className="pb-14">
          <Outlet />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(RecurringWorkItemsDetailsLayout);

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

import { redirect } from "react-router";
// plane imports
import { getBaseUpgradePath } from "@plane/utils";
import { DEFAULT_EXTERNAL_UPGRADE_PLAN, isExternalUpgradePlanType } from "@plane/constants";
// components
import { WorkspaceSelector } from "@/components/upgrade/workspace-selector";
// types
import type { Route } from "./+types/page";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!isExternalUpgradePlanType(params.planType)) {
    throw redirect(getBaseUpgradePath(DEFAULT_EXTERNAL_UPGRADE_PLAN));
  }
  return { planType: params.planType };
}

export default function CloudUpgradePage({ loaderData }: Route.ComponentProps) {
  return <WorkspaceSelector planType={loaderData.planType} />;
}

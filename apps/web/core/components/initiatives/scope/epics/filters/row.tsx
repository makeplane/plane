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

import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row/basic";
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { observer } from "mobx-react";

export const InitiativeScopeEpicFiltersRow = observer(function InitiativeScopeEpicFiltersRow({
  epicFilterInstance,
}: {
  epicFilterInstance: IWorkItemFilterInstance["richFiltersInstance"];
}) {
  if (!epicFilterInstance) return null;
  return <WorkItemFiltersRow filter={epicFilterInstance} />;
});

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

import type { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
// local imports
import { RecurringWorkItemsEmptyState } from "./empty-state";
import { RecurringWorkItemsSettingsList } from "./list/root";

type TRecurringWorkItemsSettingsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const RecurringWorkItemsSettingsRoot = observer(function RecurringWorkItemsSettingsRoot(
  props: TRecurringWorkItemsSettingsRootProps
) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { isRecurringWorkItemsInitializing, isAnyRecurringWorkItemsAvailableForProject } = useRecurringWorkItems();
  // derived values
  const isRecurringWorkItemsAvailable = isAnyRecurringWorkItemsAvailableForProject(workspaceSlug, projectId);

  if (!isRecurringWorkItemsInitializing && !isRecurringWorkItemsAvailable) {
    return <RecurringWorkItemsEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />;
  }

  return <RecurringWorkItemsSettingsList workspaceSlug={workspaceSlug} projectId={projectId} />;
});

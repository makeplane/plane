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
// components
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
// plane-web
import { ArchivedEpicQuickActions } from "@/components/epics/quick-actions/archived-epic";

export const ArchivedEpicListLayout = observer(function ArchivedEpicListLayout() {
  const canEditPropertiesBasedOnProject = () => false;

  return (
    <BaseListRoot
      QuickActions={ArchivedEpicQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      isEpic
    />
  );
});

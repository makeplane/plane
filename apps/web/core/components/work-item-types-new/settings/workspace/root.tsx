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
import { WorkItemTypesSettingsTabs } from "../work-item-types-tabs";
import { WorkspaceWorkItemTypesTypesTabContent } from "./types-tab-content";
import { WorkspacePropertiesTabContent } from "./properties-tab-content";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceWorkItemTypesSettingsRoot = observer(function WorkspaceWorkItemTypesSettingsRoot(props: Props) {
  // props
  const { workspaceSlug } = props;
  return (
    <WorkItemTypesSettingsTabs
      TypesTab={<WorkspaceWorkItemTypesTypesTabContent workspaceSlug={workspaceSlug} />}
      PropertiesTab={<WorkspacePropertiesTabContent workspaceSlug={workspaceSlug} />}
    />
  );
});

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
import { ETemplateLevel } from "@plane/constants";
import { useProjectTemplates, useWorkItemTemplates, usePageTemplates } from "@/plane-web/hooks/store";
// local imports
import { WorkspaceSettingsTemplatesListRoot } from "./list";
import { NoTemplatesEmptyState } from "./no-templates";

type TWorkspaceTemplatesSettingsRootProps = {
  workspaceSlug: string;
};

export const WorkspaceTemplatesSettingsRoot = observer(function WorkspaceTemplatesSettingsRoot(
  props: TWorkspaceTemplatesSettingsRootProps
) {
  const { workspaceSlug } = props;
  // store hooks
  const { isInitializingTemplates: isInitializingProjectTemplates, isAnyProjectTemplatesAvailable } =
    useProjectTemplates();
  const { isInitializingTemplates: isInitializingWorkItemTemplates, isAnyWorkItemTemplatesAvailable } =
    useWorkItemTemplates();
  const { isInitializingTemplates: isInitializingPageTemplates, isAnyPageTemplatesAvailable } = usePageTemplates();
  // derived values
  const isProjectTemplatesAvailable = isAnyProjectTemplatesAvailable(workspaceSlug);
  const isWorkItemTemplatesAvailable = isAnyWorkItemTemplatesAvailable(workspaceSlug);
  const isPageTemplatesAvailable = isAnyPageTemplatesAvailable(workspaceSlug);
  const isInitializingTemplates =
    isInitializingProjectTemplates || isInitializingWorkItemTemplates || isInitializingPageTemplates;
  const isAnyTemplatesAvailable =
    isProjectTemplatesAvailable || isWorkItemTemplatesAvailable || isPageTemplatesAvailable;

  if (!isInitializingTemplates && !isAnyTemplatesAvailable) {
    return <NoTemplatesEmptyState workspaceSlug={workspaceSlug} currentLevel={ETemplateLevel.WORKSPACE} />;
  }

  return <WorkspaceSettingsTemplatesListRoot workspaceSlug={workspaceSlug} />;
});

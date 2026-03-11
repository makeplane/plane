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

import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { AppHeader } from "@/components/core/app-header";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkflows } from "@/hooks/store/use-workflows";
import type { ICustomSearchSelectOption } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs } from "@plane/ui";
import { observer } from "mobx-react";
import { PROJECT_SETTINGS } from "@plane/constants";
import { PROJECT_SETTINGS_ICONS } from "@/components/settings/project/sidebar/item-icon";
import { useTranslation } from "@plane/i18n";

type Props = {
  workspaceSlug: string;
  projectId: string;
  workflowId: string;
};
export const WorkflowsDetailHeader = observer(function WorkflowsDetailHeader({
  workspaceSlug,
  projectId,
  workflowId,
}: Props) {
  // router
  const router = useAppRouter();
  // store hooks
  const { getWorkflowById, getProjectWorkflows } = useWorkflows();
  const { t } = useTranslation();
  // derived values
  const workflow = getWorkflowById(workflowId);
  const workflows = getProjectWorkflows(projectId);

  const switcherOptions = workflows
    .map((wf) => ({
      value: wf.id,
      query: wf.name,
      content: wf.name,
    }))
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  return (
    <AppHeader
      header={
        <SettingsPageHeader
          leftItem={
            <div className="flex items-center gap-2">
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/settings/projects/${projectId}/workflows`}
                      label={t(PROJECT_SETTINGS.workflows.i18n_label)}
                      icon={<PROJECT_SETTINGS_ICONS.workflows />}
                    />
                  }
                />
                {workflow && (
                  <Breadcrumbs.Item
                    component={
                      <BreadcrumbNavigationSearchDropdown
                        selectedItem={workflowId}
                        navigationItems={switcherOptions}
                        onChange={(value: string) => {
                          router.push(`/${workspaceSlug}/settings/projects/${projectId}/workflows/${value}`);
                        }}
                        title={workflow.name}
                        isLast
                      />
                    }
                    isLast
                  />
                )}
              </Breadcrumbs>
            </div>
          }
        />
      }
    />
  );
});

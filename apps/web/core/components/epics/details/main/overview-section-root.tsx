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

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
import { useLocalStorage } from "@plane/hooks";
import { Tabs } from "@plane/propel/tabs";
import { EIssueServiceType } from "@plane/types";
// components
import { DependencyActionButton } from "@/components/issues/issue-detail-widgets/dependencies";
import { RelationActionButton } from "@/components/issues/issue-detail-widgets/relations";
// plane web
import { OverviewSection } from "@/components/common/layout/main/sections/overview-root";
import { useCustomers } from "@/plane-web/hooks/store";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local components
import { EpicCustomersRoot } from "./overview-section/customers-root";
import { EpicDependenciesOverviewRoot } from "./overview-section/dependency-root";
import { EpicIssuesOverviewRoot } from "./overview-section/issues-root";
import { EpicOverviewWidgetModals } from "./overview-section/modals-root";
import { EpicRelationsOverviewRoot } from "./overview-section/relation-root";
import { SubWorkItemsActions } from "./overview-section/work-items-actions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  permissions: {
    canAddDependencies: boolean;
    canAddRelations: boolean;
    canAddCustomerRequests: boolean;
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: TWorkItemProperty) => boolean;
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
};

export const EpicOverviewRoot = observer(function EpicOverviewRoot(props: Props) {
  const { workspaceSlug, projectId, epicId, permissions } = props;
  // store hooks
  const { storedValue, setValue } = useLocalStorage(`tab-epic-detail-overview-${epicId}`, "issues");
  const { toggleCreateUpdateRequestModal, isCustomersFeatureEnabled } = useCustomers();
  // derived values
  const subWorkItemPermissions = permissions.sub_work_items;
  const canAddDependencies = permissions.canAddDependencies;
  const canAddRelations = permissions.canAddRelations;
  const canAddCustomerRequests = permissions.canAddCustomerRequests;

  // Tabs
  const OVERVIEW_TABS = useMemo(() => {
    const _tabs = [
      {
        key: "issues",
        label: "Work items",
        content: (
          <EpicIssuesOverviewRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            permissions={subWorkItemPermissions}
          />
        ),
      },
      {
        key: "dependencies",
        label: "Dependencies",
        content: (
          <EpicDependenciesOverviewRoot workspaceSlug={workspaceSlug} epicId={epicId} disabled={!canAddDependencies} />
        ),
      },
      {
        key: "relations",
        label: "Relations",
        content: (
          <EpicRelationsOverviewRoot workspaceSlug={workspaceSlug} epicId={epicId} disabled={!canAddRelations} />
        ),
      },
    ];

    if (isCustomersFeatureEnabled) {
      _tabs.push({
        key: "customer-requests",
        label: "Customer requests",
        content: <EpicCustomersRoot workspaceSlug={workspaceSlug} epicId={epicId} disabled={!canAddCustomerRequests} />,
      });
    }
    return _tabs;
  }, [
    workspaceSlug,
    projectId,
    epicId,
    canAddDependencies,
    canAddRelations,
    canAddCustomerRequests,
    isCustomersFeatureEnabled,
    subWorkItemPermissions,
  ]);

  // Actions
  const OVERVIEW_ACTIONS: Record<string, React.ReactNode> = useMemo(
    () => ({
      issues: (
        <SubWorkItemsActions
          workItemId={epicId}
          workItemServiceType={EIssueServiceType.EPICS}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          canAdd={subWorkItemPermissions.getCanAdd(projectId, epicId)}
        />
      ),
      dependencies: (
        <DependencyActionButton
          issueId={epicId}
          issueServiceType={EIssueServiceType.EPICS}
          disabled={!canAddDependencies}
        />
      ),
      relations: (
        <RelationActionButton issueId={epicId} issueServiceType={EIssueServiceType.EPICS} disabled={!canAddRelations} />
      ),
      "customer-requests": (
        <button onClick={() => toggleCreateUpdateRequestModal(epicId)} disabled={!canAddCustomerRequests}>
          <PlusIcon className="h-4 w-4" />
        </button>
      ),
    }),
    [
      epicId,
      projectId,
      workspaceSlug,
      canAddDependencies,
      canAddRelations,
      canAddCustomerRequests,
      toggleCreateUpdateRequestModal,
      subWorkItemPermissions,
    ]
  );

  return (
    <OverviewSection title="Overview">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Tabs defaultValue={storedValue ?? OVERVIEW_TABS[0].key} onValueChange={setValue}>
            <div className="flex items-center justify-between">
              <Tabs.List className="w-fit">
                {OVERVIEW_TABS.map((tab) => (
                  <Tabs.Trigger key={tab.key} value={tab.key} size="sm">
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              <div className="flex items-center justify-end gap-2">
                {storedValue ? OVERVIEW_ACTIONS[storedValue] : <></>}
              </div>
            </div>
            <div className="mt-2">
              {OVERVIEW_TABS.map((tab) => (
                <Tabs.Content key={tab.key} value={tab.key}>
                  {tab.content}
                </Tabs.Content>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
      <EpicOverviewWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
    </OverviewSection>
  );
});

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
import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
import { useLocalStorage } from "@plane/hooks";
import { Tabs } from "@plane/propel/tabs";
import { EIssueServiceType } from "@plane/types";
// components
import { RelationActionButton } from "@/components/issues/issue-detail-widgets/relations";
// plane web
import { OverviewSection } from "@/components/common/layout/main/sections/overview-root";
// local components
import { useCustomers } from "@/plane-web/hooks/store";
import { EpicCustomersRoot } from "./overview-section/customers-root";
import { EpicIssuesOverviewRoot } from "./overview-section/issues-root";
import { EpicOverviewWidgetModals } from "./overview-section/modals-root";
import { EpicRelationsOverviewRoot } from "./overview-section/relation-root";
import { SubWorkItemsActions } from "./overview-section/work-items-actions";
type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicOverviewRoot = observer(function EpicOverviewRoot(props: Props) {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const { storedValue, setValue } = useLocalStorage(`tab-epic-detail-overview-${epicId}`, "issues");
  const { toggleCreateUpdateRequestModal, isCustomersFeatureEnabled } = useCustomers();

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
            disabled={disabled}
          />
        ),
      },
      {
        key: "relations",
        label: "Relations",
        content: <EpicRelationsOverviewRoot workspaceSlug={workspaceSlug} epicId={epicId} disabled={disabled} />,
      },
    ];

    if (isCustomersFeatureEnabled) {
      _tabs.push({
        key: "customer-requests",
        label: "Customer requests",
        content: <EpicCustomersRoot workspaceSlug={workspaceSlug} epicId={epicId} disabled={disabled} />,
      });
    }
    return _tabs;
  }, [workspaceSlug, projectId, epicId, disabled, isCustomersFeatureEnabled]);

  // Actions
  const OVERVIEW_ACTIONS: Record<string, React.ReactNode> = useMemo(
    () => ({
      issues: (
        <SubWorkItemsActions
          workItemId={epicId}
          workItemServiceType={EIssueServiceType.EPICS}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          disabled={disabled}
        />
      ),
      relations: (
        <RelationActionButton issueId={epicId} issueServiceType={EIssueServiceType.EPICS} disabled={disabled} />
      ),
      "customer-requests": (
        <button onClick={() => toggleCreateUpdateRequestModal(epicId)} disabled={disabled}>
          <PlusIcon className="h-4 w-4" />
        </button>
      ),
    }),
    [epicId, projectId, workspaceSlug, disabled, toggleCreateUpdateRequestModal]
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

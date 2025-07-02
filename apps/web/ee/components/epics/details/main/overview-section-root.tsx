"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { useLocalStorage } from "@plane/hooks";
import { EIssueServiceType } from "@plane/types";
import { Tabs } from "@plane/ui";
// components
import { RelationActionButton } from "@/components/issues";
// plane web
import { OverviewSection } from "@/plane-web/components/common/layout/main/sections/overview-root";
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

export const EpicOverviewRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const { storedValue } = useLocalStorage(`tab-epic-detail-overview-${epicId}`, "issues");
  const { toggleCreateUpdateRequestModal, isCustomersFeatureEnabled } = useCustomers();

  // Tabs
  const OVERVIEW_TABS = useMemo(() => {
    const _tabs = [
      {
        key: "issues",
        label: "Work items",
        content: <EpicIssuesOverviewRoot workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />,
      },
      {
        key: "relations",
        label: "Relations",
        content: <EpicRelationsOverviewRoot workspaceSlug={workspaceSlug} epicId={epicId} />,
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
        <button onClick={() => toggleCreateUpdateRequestModal(epicId)}>
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
          <Tabs
            tabs={OVERVIEW_TABS}
            storageKey={`epic-detail-overview-${epicId}`}
            defaultTab="issues"
            containerClassName=""
            tabListClassName="w-36"
            tabListContainerClassName="justify-between"
            tabClassName="px-2 py-1"
            actions={
              <div className="flex items-center justify-end gap-2">
                {storedValue ? OVERVIEW_ACTIONS[storedValue] : <></>}
              </div>
            }
          />
        </div>
      </div>
      <EpicOverviewWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
    </OverviewSection>
  );
});

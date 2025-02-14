"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { Tabs } from "@plane/ui";
// components
import { RelationActionButton, SubIssuesActionButton } from "@/components/issues";
// plane web
import { OverviewSection } from "@/plane-web/components/common/layout/main/sections/overview-root";
// local components
import { EpicIssuesOverviewRoot } from "./overview-section/issues-root";
import { EpicOverviewWidgetModals } from "./overview-section/modals-root";
import { EpicRelationsOverviewRoot } from "./overview-section/relation-root";

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

  // Tabs
  const OVERVIEW_TABS = useMemo(
    () => [
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
    ],
    [workspaceSlug, projectId, epicId]
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
                {storedValue === "issues" ? (
                  <SubIssuesActionButton
                    issueId={epicId}
                    issueServiceType={EIssueServiceType.EPICS}
                    disabled={disabled}
                  />
                ) : (
                  <RelationActionButton
                    issueId={epicId}
                    issueServiceType={EIssueServiceType.EPICS}
                    disabled={disabled}
                  />
                )}
              </div>
            }
          />
        </div>
      </div>
      <EpicOverviewWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
    </OverviewSection>
  );
});

"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { getButtonStyling, LayersIcon, Tabs } from "@plane/ui";
// components
import { RelationActionButton, SubIssuesActionButton } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common";
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
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { storedValue } = useLocalStorage(`tab-epic-detail-overview-${epicId}`, "issues");

  // Tabs
  const OVERVIEW_TABS = useMemo(
    () => [
      {
        key: "issues",
        label: "Issues",
        content: <EpicIssuesOverviewRoot workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />,
      },
      {
        key: "relations",
        label: "Relations",
        content: <EpicRelationsOverviewRoot workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />,
      },
    ],
    [workspaceSlug, projectId, epicId]
  );

  // derived values
  const issue = getIssueById(epicId);

  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;

  return (
    <OverviewSection title="Overview">
      <div className="flex flex-col gap-4">
        {hasSubIssues ? (
          <>
            <div className="flex items-center justify-between">
              <Tabs
                tabs={OVERVIEW_TABS}
                storageKey={`epic-detail-overview-${epicId}`}
                defaultTab="issues"
                containerClassName=""
                tabListClassName="w-36"
                tabListContainerClassName="justify-between"
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
          </>
        ) : (
          <SectionEmptyState
            heading="No issues yet"
            subHeading="Start adding issues manage and track the progress of the epic."
            icon={<LayersIcon className="size-4" />}
            actionElement={
              <SubIssuesActionButton
                issueId={epicId}
                issueServiceType={EIssueServiceType.EPICS}
                disabled={disabled}
                customButton={
                  <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>
                    Add issues
                  </span>
                }
              />
            }
          />
        )}
      </div>

      <EpicOverviewWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
    </OverviewSection>
  );
});

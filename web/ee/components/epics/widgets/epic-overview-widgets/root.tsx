"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { getButtonStyling, LayersIcon, Tabs } from "@plane/ui";
import { RelationActionButton, SubIssuesActionButton } from "@/components/issues";
import { cn } from "@/helpers/common.helper";
import { useIssueDetail } from "@/hooks/store";
import { EpicIssuesOverviewRoot } from "./issues-root";
import { EpicOverviewWidgetModals } from "./modals-root";
import { EpicRelationsOverviewRoot } from "./relation-root";

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
  // TODO: useMemo
  const OVERVIEW_TABS = [
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
  ];

  // derived values
  const issue = getIssueById(epicId);

  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;
  const hasAnyLinkOrAttachment = (issue?.link_count ?? 0) > 0 || (issue?.attachment_count ?? 0) > 0;

  return (
    <div
      className={cn("py-4", {
        "border-t border-custom-border-200": !hasSubIssues && !hasAnyLinkOrAttachment,
      })}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center ">
          <span className="text-base text-custom-text-300 font-medium w-">Overview</span>
        </div>
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
          <div className="flex flex-col gap-4 items-center justify-center rounded-md border border-custom-border-200 p-10">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center size-8 bg-custom-background-80 rounded">
                <LayersIcon className="size-4" />
              </div>
              <span className="text-sm font-medium">No issues yet</span>
              <span className="text-xs text-custom-text-300">
                Start adding issues manage and track the progress of the epic.
              </span>
            </div>
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
          </div>
        )}
      </div>

      <EpicOverviewWidgetModals workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
    </div>
  );
});

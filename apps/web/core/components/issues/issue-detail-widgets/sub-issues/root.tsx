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
// plane imports
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { SubIssuesCollapsibleContent } from "./content";
import { SubWorkItemTitleActions } from "./title-actions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  permissions: {
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
  issueServiceType: TIssueServiceType;
};

export const SubIssuesCollapsible = observer(function SubIssuesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, permissions, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("sub-work-items");
  const subIssuesDistribution = stateDistributionByIssueId(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues?.length ?? 0;
  const percentage = completedCount && totalCount ? (completedCount / totalCount) * 100 : 0;

  if (!subIssues) return null;

  return (
    <EntityDetailWidgetSection
      title={issueServiceType === EIssueServiceType.EPICS ? t("issue.label", { count: 1 }) : t("common.sub_work_items")}
      count={totalCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("sub-work-items")}
      actionElement={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-tertiary text-13">
            <CircularProgressIndicator size={18} percentage={percentage} strokeWidth={3} />
            <span>
              {completedCount}/{totalCount} {t("common.done")}
            </span>
          </div>
          <SubWorkItemTitleActions
            projectId={projectId}
            parentId={issueId}
            disabled={!permissions.getCanAdd(projectId, issueId)}
            issueServiceType={issueServiceType}
          />
        </div>
      }
    >
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        permissions={permissions}
        issueServiceType={issueServiceType}
      />
    </EntityDetailWidgetSection>
  );
});

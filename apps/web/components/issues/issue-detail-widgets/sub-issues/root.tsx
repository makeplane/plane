/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { SubIssuesCollapsibleContent } from "./content";
import { SubIssuesProgressChip } from "./title";
import { SubWorkItemTitleActions } from "./title-actions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const SubIssuesCollapsible = observer(function SubIssuesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("sub-work-items");
  const subIssuesCount = subIssuesByIssueId(issueId)?.length ?? 0;

  return (
    <EntityDetailWidgetSection
      title={issueServiceType === EIssueServiceType.EPICS ? t("issue.label", { count: 1 }) : t("common.sub_work_items")}
      count={subIssuesCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("sub-work-items")}
      titleAccessory={<SubIssuesProgressChip parentIssueId={issueId} issueServiceType={issueServiceType} />}
      actions={
        <SubWorkItemTitleActions
          projectId={projectId}
          parentId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
    >
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </EntityDetailWidgetSection>
  );
});

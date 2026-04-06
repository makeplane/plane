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
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { PagesCollapsibleContent } from "./content";
import { PagesActionButton } from "./quick-action-button";

type Props = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  projectId: string | null | undefined;
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsible = observer(function PagesCollapsible(props: Props) {
  const { workspaceSlug, workItemId, disabled, projectId, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    pages: { getPagesByIssueId, pagesMap },
  } = useIssueDetail(issueServiceType);

  // derived values
  const isCollapsibleOpen = openWidgets.includes("pages");
  const issuePages = getPagesByIssueId(workItemId);
  const count = issuePages.length;

  if (!projectId || count === 0) return null;
  return (
    <EntityDetailWidgetSection
      title={t("issue.pages.linked_pages")}
      count={count}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("pages")}
      actionElement={
        !disabled ? (
          <PagesActionButton issueServiceType={issueServiceType} disabled={disabled} workItemId={workItemId} />
        ) : undefined
      }
    >
      <PagesCollapsibleContent
        workItemId={workItemId}
        workspaceSlug={workspaceSlug}
        disabled={disabled}
        projectId={projectId}
        data={issuePages.map((pageId) => pagesMap[pageId])}
        issueServiceType={issueServiceType}
      />
    </EntityDetailWidgetSection>
  );
});

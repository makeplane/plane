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

import { Paperclip } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, ViewsIcon, RelationPropertyIcon, PageIcon } from "@plane/propel/icons";
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// local imports
import { IssueAttachmentActionButton } from "./attachments";
import { IssueLinksActionButton } from "./links";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
import { IssueDetailWidgetButton } from "./widget-button";
import { PagesActionButton } from "./pages";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
};

export function IssueDetailWidgetActionButtons(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex items-center flex-wrap gap-2">
      {!hideWidgets?.includes("sub-work-items") && (
        <SubIssuesActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.sub_issue")}
              icon={<ViewsIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("relations") && (
        <RelationActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.relation")}
              icon={<RelationPropertyIcon className="h-3.5 w-3.5 flex-shrink-0" />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("links") && (
        <IssueLinksActionButton
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.link")}
              icon={<LinkIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("attachments") && (
        <IssueAttachmentActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("common.attach")}
              icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("pages") && (
        <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.LINK_PAGES} fallback={<></>}>
          <PagesActionButton
            issueServiceType={issueServiceType}
            disabled={disabled}
            workItemId={issueId}
            customButton={
              <IssueDetailWidgetButton
                title={t("issue.pages.link_pages")}
                icon={<PageIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
                disabled={disabled}
              />
            }
          />
        </WithFeatureFlagHOC>
      )}
    </div>
  );
}

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
import { EntityDetailWidgetToolbar } from "@plane/blocks/entity-detail";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, ViewsIcon, RelationPropertyIcon, PageIcon, DependencyPropertyIcon } from "@plane/propel/icons";
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// local imports
import { IssueAttachmentActionButton } from "./attachments";
import { DependencyActionButton } from "./dependencies";
import { IssueLinksActionButton } from "./links";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
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
    <div className="py-4">
      <EntityDetailWidgetToolbar>
        {!hideWidgets?.includes("sub-work-items") && (
          <EntityDetailWidgetToolbar.Section>
            <SubIssuesActionButton
              issueId={issueId}
              customButton={
                <EntityDetailWidgetToolbar.TextButton
                  icon={<ViewsIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
                  label={t("issue.add.sub_issue")}
                  disabled={disabled}
                />
              }
              disabled={disabled}
              issueServiceType={issueServiceType}
            />
          </EntityDetailWidgetToolbar.Section>
        )}
        {(!hideWidgets?.includes("dependencies") || !hideWidgets?.includes("relations")) && (
          <EntityDetailWidgetToolbar.Section>
            {!hideWidgets?.includes("dependencies") && (
              <DependencyActionButton
                issueId={issueId}
                customButton={
                  <EntityDetailWidgetToolbar.DropdownButton
                    icon={<DependencyPropertyIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                    disabled={disabled}
                    ariaLabel={t("issue.add.dependency")}
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
                  <EntityDetailWidgetToolbar.DropdownButton
                    icon={<RelationPropertyIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                    disabled={disabled}
                    ariaLabel={t("issue.add.relation")}
                  />
                }
                disabled={disabled}
                issueServiceType={issueServiceType}
              />
            )}
          </EntityDetailWidgetToolbar.Section>
        )}
        {(!hideWidgets?.includes("links") || !hideWidgets?.includes("attachments")) && (
          <EntityDetailWidgetToolbar.Section>
            {!hideWidgets?.includes("links") && (
              <IssueLinksActionButton
                customButton={
                  <EntityDetailWidgetToolbar.IconButton
                    icon={<LinkIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
                    disabled={disabled}
                    ariaLabel={t("issue.add.link")}
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
                  <EntityDetailWidgetToolbar.IconButton
                    icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
                    disabled={disabled}
                    ariaLabel={t("common.attach")}
                  />
                }
                disabled={disabled}
                issueServiceType={issueServiceType}
              />
            )}
          </EntityDetailWidgetToolbar.Section>
        )}
        {!hideWidgets?.includes("pages") && (
          <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.LINK_PAGES} fallback={<></>}>
            <EntityDetailWidgetToolbar.Section>
              <PagesActionButton
                issueServiceType={issueServiceType}
                disabled={disabled}
                workItemId={issueId}
                customButton={
                  <EntityDetailWidgetToolbar.IconButton
                    icon={<PageIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
                    disabled={disabled}
                    ariaLabel={t("issue.pages.link_pages")}
                  />
                }
              />
            </EntityDetailWidgetToolbar.Section>
          </WithFeatureFlagHOC>
        )}
      </EntityDetailWidgetToolbar>
    </div>
  );
}

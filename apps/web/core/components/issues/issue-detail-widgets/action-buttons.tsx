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
import { Tooltip } from "@plane/propel/tooltip";
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
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
  permissions: {
    canAddSubWorkItems: boolean;
    canAddDependencies: boolean;
    canAddRelations: boolean;
    canAddLinks: boolean;
    canAddAttachments: boolean;
    canAddPages: boolean;
  };
};

export function IssueDetailWidgetActionButtons(props: Props) {
  const { workspaceSlug, projectId, issueId, issueServiceType, hideWidgets, permissions } = props;
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
                  icon={<ViewsIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                  label={t("issue.add.sub_issue")}
                  disabled={!permissions.canAddSubWorkItems}
                />
              }
              disabled={!permissions.canAddSubWorkItems}
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
                  <Tooltip tooltipContent={t("issue.add.dependency")}>
                    <span>
                      <EntityDetailWidgetToolbar.DropdownButton
                        icon={<DependencyPropertyIcon className="h-3.5 w-3.5 shrink-0" />}
                        disabled={!permissions.canAddDependencies}
                        ariaLabel={t("issue.add.dependency")}
                      />
                    </span>
                  </Tooltip>
                }
                disabled={!permissions.canAddDependencies}
                issueServiceType={issueServiceType}
              />
            )}
            {!hideWidgets?.includes("relations") && (
              <RelationActionButton
                issueId={issueId}
                customButton={
                  <Tooltip tooltipContent={t("issue.add.relation")}>
                    <span>
                      <EntityDetailWidgetToolbar.DropdownButton
                        icon={<RelationPropertyIcon className="h-3.5 w-3.5 shrink-0" />}
                        disabled={!permissions.canAddRelations}
                        ariaLabel={t("issue.add.relation")}
                      />
                    </span>
                  </Tooltip>
                }
                disabled={!permissions.canAddRelations}
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
                  <Tooltip tooltipContent={t("issue.add.link")}>
                    <span>
                      <EntityDetailWidgetToolbar.IconButton
                        icon={<LinkIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                        disabled={!permissions.canAddLinks}
                        ariaLabel={t("issue.add.link")}
                      />
                    </span>
                  </Tooltip>
                }
                disabled={!permissions.canAddLinks}
                issueServiceType={issueServiceType}
              />
            )}
            {!hideWidgets?.includes("attachments") && (
              <IssueAttachmentActionButton
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                customButton={
                  <Tooltip tooltipContent={t("common.attach")}>
                    <span>
                      <EntityDetailWidgetToolbar.IconButton
                        icon={<Paperclip className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                        disabled={!permissions.canAddAttachments}
                        ariaLabel={t("common.attach")}
                      />
                    </span>
                  </Tooltip>
                }
                disabled={!permissions.canAddAttachments}
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
                disabled={!permissions.canAddPages}
                workItemId={issueId}
                customButton={
                  <Tooltip tooltipContent={t("issue.pages.link_pages")}>
                    <span>
                      <EntityDetailWidgetToolbar.IconButton
                        icon={<PageIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                        disabled={!permissions.canAddPages}
                        ariaLabel={t("issue.pages.link_pages")}
                      />
                    </span>
                  </Tooltip>
                }
              />
            </EntityDetailWidgetToolbar.Section>
          </WithFeatureFlagHOC>
        )}
      </EntityDetailWidgetToolbar>
    </div>
  );
}

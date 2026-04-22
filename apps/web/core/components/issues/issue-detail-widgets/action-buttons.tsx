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
import { Paperclip } from "lucide-react";
// plane imports
import { EntityDetailWidgetToolbar } from "@plane/blocks/entity-detail";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  LinkIcon,
  ViewsIcon,
  RelationPropertyIcon,
  PageIcon,
  DependencyPropertyIcon,
  CustomerRequestIcon,
} from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { IssueAttachmentActionButton } from "./attachments";
import { DependencyActionButton } from "./dependencies";
import { IssueLinksActionButton } from "./links";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
import { PagesActionButton } from "./pages";

type IssueDetailWidgetActionButtonsProps = {
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
    canAddCustomerRequests: boolean;
  };
};

export const IssueDetailWidgetActionButtons = observer(function IssueDetailWidgetActionButtons(
  props: IssueDetailWidgetActionButtonsProps
) {
  const { workspaceSlug, projectId, issueId, issueServiceType, hideWidgets, permissions } = props;
  // translation
  const { t } = useTranslation();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { createUpdateRequestModalId, toggleCreateUpdateRequestModal } = useCustomers();

  const handleOpenRequestForm = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!createUpdateRequestModalId) toggleCreateUpdateRequestModal(issueId);
  };

  const shouldRenderAnyWidget =
    !hideWidgets?.includes("links") ||
    !hideWidgets?.includes("attachments") ||
    !hideWidgets?.includes("pages") ||
    (!hideWidgets?.includes("customer_requests") && isCustomersFeatureEnabled);

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
        {shouldRenderAnyWidget && (
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
            {!hideWidgets?.includes("pages") && (
              <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.LINK_PAGES} fallback={<></>}>
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
              </WithFeatureFlagHOC>
            )}
            {!hideWidgets?.includes("customer_requests") && isCustomersFeatureEnabled && (
              <Tooltip tooltipContent={t("issue.display.properties.requests")}>
                <span>
                  <EntityDetailWidgetToolbar.IconButton
                    icon={<CustomerRequestIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
                    disabled={!permissions.canAddCustomerRequests}
                    ariaLabel={t("issue.display.properties.requests")}
                    onClick={handleOpenRequestForm}
                  />
                </span>
              </Tooltip>
            )}
          </EntityDetailWidgetToolbar.Section>
        )}
      </EntityDetailWidgetToolbar>
    </div>
  );
});

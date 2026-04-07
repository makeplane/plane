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
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { TIssue, TIssueServiceType, TWorkItemWidgets } from "@plane/types";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useDependencyOptions, useCustomRelationOptions } from "@/components/relations";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
// local imports
import { AttachmentsCollapsible } from "./attachments";
import { DependenciesCollapsible } from "./dependencies";
import { LinksCollapsible } from "./links";
import { RelationsCollapsible } from "./relations";
import { SubIssuesCollapsible } from "./sub-issues";
import { CustomerRequestsCollapsible } from "./customer-requests";
import { PagesCollapsible } from "./pages";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
  permissions: {
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: keyof TIssue) => boolean; // TODO: <permissionEngine> update property type to TWorkItemProperty
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
};

export const IssueDetailWidgetCollapsibles = observer(function IssueDetailWidgetCollapsibles(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets, permissions } = props;
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId },
    attachment: { getAttachmentsCountByIssueId, getAttachmentsUploadStatusByIssueId },
    relation: { getRelationCountByIssueId },
    pages: { getPagesByIssueId },
  } = useIssueDetail(issueServiceType);
  const { isCustomersFeatureEnabled } = useCustomers();
  // derived values
  const issue = getIssueById(issueId);
  const subIssues = subIssuesByIssueId(issueId);
  const DEPENDENCY_OPTIONS = useDependencyOptions();
  const RELATION_OPTIONS = useCustomRelationOptions();
  const dependenciesCount = getRelationCountByIssueId(issueId, DEPENDENCY_OPTIONS);
  const relationsCount = getRelationCountByIssueId(issueId, RELATION_OPTIONS);
  const issuePages = getPagesByIssueId(issueId);
  const pagesCount = issuePages.length;
  // render conditions
  const shouldRenderSubIssues = !!subIssues && subIssues.length > 0 && !hideWidgets?.includes("sub-work-items");
  const shouldRenderDependencies = dependenciesCount > 0 && !hideWidgets?.includes("dependencies");
  const shouldRenderRelations = relationsCount > 0 && !hideWidgets?.includes("relations");
  const shouldRenderLinks = !!issue?.link_count && issue?.link_count > 0 && !hideWidgets?.includes("links");
  const shouldRenderCustomerRequest = Boolean(issue?.customer_request_ids?.length) && !issue?.is_epic;
  const shouldRenderPages = !hideWidgets?.includes("pages") && pagesCount > 0;
  const attachmentUploads = getAttachmentsUploadStatusByIssueId(issueId);
  const attachmentsCount = getAttachmentsCountByIssueId(issueId);
  const shouldRenderAttachments =
    attachmentsCount > 0 ||
    (!!attachmentUploads && attachmentUploads.length > 0 && !hideWidgets?.includes("attachments"));

  const shouldRenderAnyWidget =
    shouldRenderSubIssues ||
    shouldRenderDependencies ||
    shouldRenderRelations ||
    shouldRenderLinks ||
    shouldRenderAttachments ||
    (shouldRenderCustomerRequest && isCustomersFeatureEnabled) ||
    shouldRenderPages;

  if (!issue || !shouldRenderAnyWidget) return <></>;

  return (
    <div className="flex flex-col">
      {shouldRenderSubIssues && (
        <SubIssuesCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          permissions={permissions.sub_work_items}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderDependencies && (
        <DependenciesCollapsible
          workspaceSlug={workspaceSlug}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderRelations && (
        <RelationsCollapsible
          workspaceSlug={workspaceSlug}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderLinks && (
        <LinksCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderAttachments && (
        <AttachmentsCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {shouldRenderCustomerRequest && isCustomersFeatureEnabled && (
        <CustomerRequestsCollapsible workItemId={issueId} workspaceSlug={workspaceSlug} disabled={disabled} />
      )}
      {shouldRenderPages && (
        <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.LINK_PAGES} fallback={<></>}>
          <PagesCollapsible
            workItemId={issueId}
            workspaceSlug={workspaceSlug}
            disabled={disabled}
            projectId={issue?.project_id}
            issueServiceType={issueServiceType}
          />
        </WithFeatureFlagHOC>
      )}
    </div>
  );
});

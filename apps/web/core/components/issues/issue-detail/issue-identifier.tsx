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

import type { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { EWorkItemTypeEntity } from "@plane/types";
import type { TIssueTypeIdentifierExtended, TIssueIdentifierPropsExtended } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypeIdentifier: FC<TIssueTypeIdentifierExtended> = observer((props) => {
  const { getWorkItemTypeById, issueTypeId, size = "sm" } = props;
  // derived values
  const workItemTypeFromStore = useIssueType(issueTypeId);
  const issueType = getWorkItemTypeById ? getWorkItemTypeById(issueTypeId) : workItemTypeFromStore;

  return (
    <Tooltip tooltipContent={issueType?.name} disabled={!issueType?.name} position="top-start">
      <div className="flex flex-shrink-0">
        <IssueTypeLogo
          icon_props={issueType?.logo_props?.icon}
          size={size}
          isDefault={issueType?.is_default}
          isEpic={issueType?.is_epic}
        />
      </div>
    </Tooltip>
  );
});

export const IssueIdentifier: React.FC<TIssueIdentifierPropsExtended> = observer((props) => {
  const {
    displayProperties,
    enableClickToCopyIdentifier = false,
    getWorkItemTypeById,
    projectId,
    size = "sm",
    variant = "default",
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { loader: issueTypesLoader, isWorkItemTypeEntityEnabledForProject } = useIssueTypes();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const issueType = useIssueType(issueTypeId);
  const isWorkItemTypeEntityEnabled = props.isWorkItemTypeEntityEnabled ?? isWorkItemTypeEntityEnabledForProject;
  const isWorkItemTypeEnabled = isWorkItemTypeEntityEnabled(
    workspaceSlug?.toString(),
    projectId,
    issueType?.is_epic ? EWorkItemTypeEntity.EPIC : EWorkItemTypeEntity.WORK_ITEM
  );
  const shouldRenderIssueTypeIcon = displayProperties ? displayProperties.issue_type : true;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!isWorkItemTypeEnabled) {
    return (
      <div className="shrink-0 flex items-center space-x-2">
        <IdentifierText
          identifier={`${projectIdentifier}-${issueSequenceId}`}
          enableClickToCopyIdentifier={enableClickToCopyIdentifier}
          variant={variant}
          size={size}
        />
      </div>
    );
  }

  if (!shouldRenderIssueTypeIcon && !shouldRenderIssueID) return null;

  if (issueTypesLoader === "init-loader") {
    return (
      <Loader className="flex flex-shrink-0 w-20 h-5">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );
  }

  return (
    <div className={cn("flex flex-shrink-0 items-center", size === "xs" ? "space-x-1" : "space-x-2")}>
      {shouldRenderIssueTypeIcon && issueTypeId && (
        <IssueTypeIdentifier getWorkItemTypeById={getWorkItemTypeById} issueTypeId={issueTypeId} size={size} />
      )}
      {shouldRenderIssueID && (
        <IdentifierText
          identifier={`${projectIdentifier}-${issueSequenceId}`}
          enableClickToCopyIdentifier={enableClickToCopyIdentifier}
          size={size}
          variant={variant}
        />
      )}
    </div>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { IIssueDisplayProperties, TIssue, TIssueCustomFields } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectCustomFields } from "@/plane-web/hooks/use-project-custom-fields";
import { isCustomFieldVisibleOnCard } from "@/plane-web/helpers/custom-fields/format-display-value";
import { CustomFieldCardDropdown } from "./custom-field-card-dropdown";

export type TWorkItemLayoutAdditionalProperties = {
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
  isReadOnly?: boolean;
  updateIssue?: (projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>;
};

export const WorkItemLayoutAdditionalProperties = observer(function WorkItemLayoutAdditionalProperties(
  props: TWorkItemLayoutAdditionalProperties
) {
  const { displayProperties, issue: issueProp, isReadOnly = false, updateIssue } = props;
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  const projectId = issueProp.project_id ?? (routerProjectId ? routerProjectId.toString() : undefined);

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const issue = getIssueById(issueProp.id) ?? issueProp;

  const { properties } = useProjectCustomFields(workspaceSlug?.toString(), projectId);

  const visibleProperties = properties.filter((property) => isCustomFieldVisibleOnCard(displayProperties, property.id));

  const handleCustomFieldsUpdate = useCallback(
    async (customFields: TIssueCustomFields) => {
      if (!updateIssue || !issue.project_id) return;
      await updateIssue(issue.project_id, issue.id, { custom_fields: customFields });
    },
    [updateIssue, issue.project_id, issue.id]
  );

  if (visibleProperties.length === 0) return null;

  return (
    <>
      {visibleProperties.map((property) => (
        <CustomFieldCardDropdown
          key={property.id}
          property={property}
          issue={issue}
          isReadOnly={isReadOnly || !updateIssue}
          onUpdate={handleCustomFieldsUpdate}
        />
      ))}
    </>
  );
});

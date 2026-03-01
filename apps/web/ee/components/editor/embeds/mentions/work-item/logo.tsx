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
import { useParams } from "react-router";
// plane imports
import { StateGroupIcon } from "@plane/propel/icons";
import type { TIssue, TStateGroups } from "@plane/types";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  className?: string;
  projectId?: TIssue["project_id"];
  showOnlyWorkItemType?: boolean;
  stateColor?: string;
  stateGroup?: TStateGroups;
  workItemTypeId?: TIssue["type_id"];
};

export const EditorWorkItemMentionLogo = observer(function EditorWorkItemMentionLogo(props: Props) {
  const { className, projectId, showOnlyWorkItemType = false, stateColor, stateGroup, workItemTypeId } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  const workItemType = useIssueType(workItemTypeId);
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug ?? "", projectId ?? "");

  if (showOnlyWorkItemType && !isWorkItemTypeEnabled) return null;

  return (
    <>
      {isWorkItemTypeEnabled ? (
        <IssueTypeLogo
          icon_props={workItemType?.logo_props?.icon}
          size="xs"
          isDefault={workItemType?.is_default}
          containerClassName={className}
        />
      ) : (
        <StateGroupIcon stateGroup={stateGroup ?? "backlog"} color={stateColor} className={className} />
      )}
    </>
  );
});

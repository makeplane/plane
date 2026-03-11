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

import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { observer } from "mobx-react";

type Props = {
  workItemTypeIds: string[];
};

export const WorkflowCardFooter = observer(function WorkflowCardFooter(props: Props) {
  const { workItemTypeIds } = props;
  // hooks
  const { getIssueTypeById } = useIssueTypes();

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-layer-1 border-t border-subtle">
      {workItemTypeIds.map((id) => {
        const workItemType = getIssueTypeById(id);
        if (!workItemType) return null;
        return (
          <div className="flex items-center gap-2 rounded-md bg-layer-2 p-1 border border-subtle" key={id}>
            <IssueTypeIdentifier issueTypeId={id} size="xs" />
            <span className="text-caption-md-regular">{workItemType.name}</span>
          </div>
        );
      })}
    </div>
  );
});

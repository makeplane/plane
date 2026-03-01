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
import { Combobox } from "@headlessui/react";
// ui
import type { ISearchIssueResponse } from "@plane/types";
import { Checkbox } from "@plane/ui";
// hooks
// plane web hooks
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

interface Props {
  issue: ISearchIssueResponse;
  canDeleteIssueIds: boolean;
}

export const BulkDeleteIssuesModalItem = observer(function BulkDeleteIssuesModalItem(props: Props) {
  const { issue, canDeleteIssueIds } = props;

  const color = issue.state__color;

  return (
    <Combobox.Option
      key={issue.id}
      as="div"
      value={issue.id}
      className={({ active }) =>
        `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 my-0.5 ${
          active ? "bg-layer-1 text-primary" : ""
        }`
      }
    >
      <div className="flex items-center gap-2">
        <Checkbox checked={canDeleteIssueIds} readOnly />
        <span
          className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />
        <IssueIdentifier
          projectId={issue.project_id}
          issueTypeId={issue.type_id}
          projectIdentifier={issue.project__identifier}
          issueSequenceId={issue.sequence_id}
          size="xs"
        />
        <span>{issue.name}</span>
      </div>
    </Combobox.Option>
  );
});

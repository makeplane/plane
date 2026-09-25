/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ComboboxItem } from "@makeplane/propel/components/combobox";
import type { ISearchIssueResponse } from "@plane/types";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

interface Props {
  issue: ISearchIssueResponse;
}

export const BulkDeleteIssuesModalItem = observer(function BulkDeleteIssuesModalItem(props: Props) {
  const { issue } = props;

  const color = issue.state__color;

  return (
    // `selection="checkbox"` draws the multi-select checkbox; Base UI drives it off the root's
    // value, so the row no longer needs a hand-placed checkbox or a `checked` prop.
    <ComboboxItem
      value={issue.id}
      selection="checkbox"
      label={issue.name}
      icon={
        <span className="flex flex-shrink-0 items-center gap-2">
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
        </span>
      }
    />
  );
});

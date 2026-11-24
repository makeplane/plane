/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn = observer(function SpreadsheetAssigneeColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <MemberSelect
        value={issue?.assignee_ids ?? []}
        onChange={(data) => {
          onChange(
            issue,
            { assignee_ids: data },
            {
              changed_property: "assignees",
              change_details: data,
            }
          );
        }}
        projectId={issue?.project_id ?? undefined}
        disabled={disabled}
        multiple
        placeholder="Assignees"
        // `.clickable` is what the table's keyboard navigation clicks on Enter / Space in a focused cell.
        className="clickable"
        variant="table-cell"
        onClose={onClose}
      />
    </div>
  );
});

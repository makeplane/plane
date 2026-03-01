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

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

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
      <MemberDropdown
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
        buttonVariant={
          issue?.assignee_ids && issue.assignee_ids.length > 1 ? "transparent-without-text" : "transparent-with-text"
        }
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
        buttonContainerClassName="w-full"
        optionsClassName="z-[9]"
        onClose={onClose}
      />
    </div>
  );
});

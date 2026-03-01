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
// hooks
import { useLabel } from "@/hooks/store/use-label";
// components
import { IssuePropertyLabels } from "../../properties";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetLabelColumn = observer(function SpreadsheetLabelColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  // hooks
  const { labelMap } = useLabel();

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  return (
    <div className="h-11 border-b-[0.5px] border-subtle w-full">
      <IssuePropertyLabels
        projectId={issue.project_id ?? null}
        value={issue.label_ids || []}
        defaultOptions={defaultLabelOptions}
        onChange={(data) => onChange(issue, { label_ids: data }, { changed_property: "labels", change_details: data })}
        className="h-full w-full "
        buttonClassName="px-page-x w-full h-full group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 rounded-none"
        hideDropdownArrow
        maxRender={1}
        disabled={disabled}
        placeholderText="Select labels"
        onClose={onClose}
        noLabelBorder
        fullWidth
        fullHeight
      />
    </div>
  );
});

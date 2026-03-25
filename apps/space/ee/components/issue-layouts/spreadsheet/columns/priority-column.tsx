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
// components
import { IssueBlockPriority } from "@/components/issues/issue-layouts/properties/priority";
// types
import type { IIssue } from "@/types/issue";

type Props = {
  issue: IIssue;
};

export const SpreadsheetPriorityColumn = observer(function SpreadsheetPriorityColumn(props: Props) {
  const { issue } = props;

  return (
    <div className="h-11 flex items-center border-b-[0.5px] border-subtle-1 px-2.5">
      <IssueBlockPriority priority={issue.priority} shouldShowName />
    </div>
  );
});

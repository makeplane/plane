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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import type { TIssue } from "@plane/types";
// components
import { ReleaseSelect } from "@/components/issues/issue-detail/release-select";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetReleaseColumn = observer(function SpreadsheetReleaseColumn(props: Props) {
  const { issue, disabled, onClose, onChange } = props;
  // router
  const { workspaceSlug } = useParams();

  const handleChange = useCallback(
    async (updatedIds: string[]) => {
      onChange(issue, { release_ids: updatedIds }, { release_ids: updatedIds });
    },
    [issue, onChange]
  );

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <ReleaseSelect
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        issueId={issue.id}
        releaseIds={issue.release_ids}
        onChange={handleChange}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full relative flex items-center p-2 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
        buttonClassName="relative leading-4 h-4.5 bg-transparent hover:bg-transparent px-0!"
        onClose={onClose}
        showCount
      />
    </div>
  );
});

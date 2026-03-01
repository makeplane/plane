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
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ETabIndices } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
// types
import type { ISearchIssueResponse, TIssue } from "@plane/types";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type TIssueParentTagProps = {
  control: Control<TIssue>;
  selectedParentIssue: ISearchIssueResponse;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse | null) => void;
};

export const IssueParentTag = observer(function IssueParentTag(props: TIssueParentTagProps) {
  const { control, selectedParentIssue, handleFormChange, setSelectedParentIssue } = props;
  // store hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  return (
    <Controller
      control={control}
      name="parent_id"
      render={({ field: { onChange } }) => (
        <div className="flex w-min items-center gap-2 whitespace-nowrap rounded-sm bg-surface-2 p-2 text-caption-sm-regular">
          <div className="flex items-center gap-2">
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: selectedParentIssue.state__color,
              }}
            />
            <span className="flex-shrink-0 text-secondary">
              {selectedParentIssue?.project_id && (
                <IssueIdentifier
                  projectId={selectedParentIssue.project_id}
                  issueTypeId={selectedParentIssue.type_id}
                  projectIdentifier={selectedParentIssue?.project__identifier}
                  issueSequenceId={selectedParentIssue.sequence_id}
                  size="xs"
                />
              )}
            </span>
            <span className="truncate font-medium">{selectedParentIssue.name.substring(0, 50)}</span>
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                onChange(null);
                handleFormChange();
                setSelectedParentIssue(null);
              }}
              tabIndex={getIndex("remove_parent")}
            >
              <CloseIcon className="h-3 w-3 cursor-pointer" />
            </button>
          </div>
        </div>
      )}
    />
  );
});

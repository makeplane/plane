/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { CloseOutline } from "@makeplane/propel/icons";
import { useLabel } from "@/hooks/store/use-label";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

function LabelIcons({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

export const InboxIssueAppliedFiltersLabel = observer(function InboxIssueAppliedFiltersLabel() {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getLabelById } = useLabel();
  // derived values
  const filteredValues = inboxFilters?.labels || [];
  const currentOptionDetail = (labelId: string) => getLabelById(labelId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("labels", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-11 text-tertiary capitalize hover:text-secondary">
      <div className="text-11 text-secondary">Label</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden">
              <LabelIcons color={optionDetail.color} />
            </div>
            <div className="truncate text-11">{optionDetail?.name}</div>
            <div
              className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
              onClick={() => handleInboxIssueFilters("labels", handleFilterValue(value))}
            >
              <CloseOutline className={`h-3 w-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
        onClick={clearFilter}
      >
        <CloseOutline className={`h-3 w-3`} />
      </div>
    </div>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon, CloseIcon } from "@plane/propel/icons";
import { Tag } from "@plane/ui";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useProjectState } from "@/hooks/store/use-project-state";

export const InboxIssueAppliedFiltersState = observer(function InboxIssueAppliedFiltersState() {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getStateById } = useProjectState();
  // derived values
  const filteredValues = inboxFilters?.state || [];
  const currentOptionDetail = (stateId: string) => getStateById(stateId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("state", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-11 text-secondary">State</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden">
              <StateGroupIcon color={optionDetail.color} stateGroup={optionDetail.group} size={EIconSize.SM} />
            </div>
            <div className="truncate text-11">{optionDetail?.name}</div>
            <div
              className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
              onClick={() => handleInboxIssueFilters("state", handleFilterValue(optionDetail?.id))}
            >
              <CloseIcon className={`h-3 w-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="relative flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden text-tertiary transition-all hover:text-secondary"
        onClick={clearFilter}
      >
        <CloseIcon className={`h-3 w-3`} />
      </div>
    </Tag>
  );
});

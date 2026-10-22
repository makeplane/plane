/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useProjectState } from "@/hooks/store/use-project-state";

export const InboxIssueAppliedFiltersState = observer(function InboxIssueAppliedFiltersState() {
  // hooks
  const { t } = useTranslation();
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
    <div className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-11 text-tertiary capitalize hover:text-secondary">
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
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={
                optionDetail.name
                  ? `${t("aria_labels.common.remove")}: ${optionDetail.name}`
                  : t("aria_labels.common.remove")
              }
              onClick={() => handleInboxIssueFilters("state", handleFilterValue(optionDetail?.id))}
              icon={<CloseOutline className="h-3 w-3" />}
            />
          </div>
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={`${t("aria_labels.common.remove")}: State`}
        onClick={clearFilter}
        icon={<CloseOutline className="h-3 w-3" />}
      />
    </div>
  );
});

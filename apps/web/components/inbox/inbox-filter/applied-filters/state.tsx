/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useProjectState } from "@/hooks/store/use-project-state";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

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
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">State</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            icon={<StateGroupIcon color={optionDetail.color} stateGroup={optionDetail.group} size={EIconSize.SM} />}
            label={optionDetail.name}
            ariaLabel={optionDetail.name}
            onRemove={() => handleInboxIssueFilters("state", handleFilterValue(optionDetail?.id))}
          />
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={`${t("aria_labels.common.remove")}: State`}
        onClick={clearFilter}
        icon={<Icon icon={CloseOutline} />}
      />
    </div>
  );
});

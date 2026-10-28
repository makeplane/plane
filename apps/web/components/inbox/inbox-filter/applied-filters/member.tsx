/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";

// plane types
import { Avatar } from "@makeplane/propel/components/avatar";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TInboxIssueFilterMemberKeys } from "@plane/types";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { APPLIED_FILTER_GROUP_CLASSNAME, RemovableChip } from "@/components/common/removable-chip";

type InboxIssueAppliedFiltersMemberProps = {
  filterKey: TInboxIssueFilterMemberKeys;
  label: string;
};

export const InboxIssueAppliedFiltersMember = observer(function InboxIssueAppliedFiltersMember(
  props: InboxIssueAppliedFiltersMemberProps
) {
  const { filterKey, label } = props;
  // hooks
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getUserDetails } = useMember();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (memberId: string) => getUserDetails(memberId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <div className={APPLIED_FILTER_GROUP_CLASSNAME}>
      <div className="text-caption-sm-regular text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <RemovableChip
            key={value}
            variant="soft"
            icon={
              <Avatar
                alt={optionDetail.display_name}
                fallback={optionDetail.display_name?.[0]?.toUpperCase()}
                src={getFileURL(optionDetail.avatar_url)}
                size="2xs"
              />
            }
            label={optionDetail.display_name}
            ariaLabel={optionDetail.display_name}
            onRemove={() => handleInboxIssueFilters(filterKey, handleFilterValue(value))}
          />
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={label ? `${t("aria_labels.common.remove")}: ${label}` : t("aria_labels.common.remove")}
        onClick={clearFilter}
        icon={<Icon icon={CloseOutline} />}
      />
    </div>
  );
});

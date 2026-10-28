/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";

// plane types
import { Avatar } from "@makeplane/propel/components/avatar";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import type { TInboxIssueFilterMemberKeys } from "@plane/types";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

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
    <div className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-caption-sm-regular text-tertiary capitalize hover:text-secondary">
      <div className="text-caption-sm-regular text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div
            key={value}
            className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-caption-sm-regular"
          >
            <div className="relative flex flex-shrink-0 items-center justify-center overflow-hidden">
              <Avatar
                alt={optionDetail.display_name}
                fallback={optionDetail.display_name?.[0]?.toUpperCase()}
                src={getFileURL(optionDetail.avatar_url)}
                size="2xs"
              />
            </div>
            <div className="truncate text-caption-sm-regular">{optionDetail?.display_name}</div>
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={
                optionDetail.display_name
                  ? `${t("aria_labels.common.remove")}: ${optionDetail.display_name}`
                  : t("aria_labels.common.remove")
              }
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(value))}
              icon={<CloseOutline className="h-3 w-3" />}
            />
          </div>
        );
      })}

      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        aria-label={label ? `${t("aria_labels.common.remove")}: ${label}` : t("aria_labels.common.remove")}
        onClick={clearFilter}
        icon={<CloseOutline className="h-3 w-3" />}
      />
    </div>
  );
});

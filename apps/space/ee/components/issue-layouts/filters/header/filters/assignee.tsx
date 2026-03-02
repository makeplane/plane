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

import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// hooks
import { Avatar } from "@plane/propel/avatar";
import { Loader } from "@plane/ui";
import { FilterHeader } from "@/components/issues/filters/helpers/filter-header";
import { FilterOption } from "@/components/issues/filters/helpers/filter-option";
import { useMember } from "@/hooks/store/use-member";
// components
// ui

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  allowedValues: string[] | undefined;
};

export const FilterAssignees = observer(function FilterAssignees(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery, allowedValues } = props;
  // store
  const { getMembersByIds, members: storeMembers } = useMember();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const members = allowedValues && allowedValues.length > 0 ? getMembersByIds(allowedValues) : storeMembers;

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (members || []).filter((member) =>
      member?.member__display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return sortBy(filteredOptions, [
      (member) => !(appliedFilters ?? []).includes(member.member),
      (member) => member?.member__display_name.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`Assignee${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((member) => {
                  if (!member) return null;
                  const memberId = member.member;
                  return (
                    <FilterOption
                      key={`assignees-${memberId}`}
                      isChecked={appliedFilters?.includes(memberId) ? true : false}
                      onClick={() => handleUpdate(memberId)}
                      icon={
                        <Avatar
                          name={member.member__display_name}
                          src={member.member__avatar}
                          showTooltip={false}
                          size="md"
                        />
                      }
                      title={member?.member__display_name}
                    />
                  );
                })}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 italic text-placeholder">No matches found</p>
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </>
  );
});

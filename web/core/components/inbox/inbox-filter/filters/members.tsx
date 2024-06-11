"use client";

import { FC, useMemo, useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { TInboxIssueFilterMemberKeys } from "@plane/types";
import { Avatar, Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// hooks
import { useMember, useProjectInbox, useUser } from "@/hooks/store";

type Props = {
  filterKey: TInboxIssueFilterMemberKeys;
  label?: string;
  memberIds: string[] | undefined;
  searchQuery: string;
};

export const FilterMember: FC<Props> = observer((props: Props) => {
  const { filterKey, label = "Members", memberIds, searchQuery } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const filterValue = inboxFilters?.[filterKey] || [];
  const appliedFiltersCount = filterValue?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (memberIds || []).filter((memberId) =>
      getUserDetails(memberId)?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return sortBy(filteredOptions, [
      (memberId) => !filterValue.includes(memberId),
      (memberId) => memberId !== currentUser?.id,
      (memberId) => getUserDetails(memberId)?.display_name.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  const handleFilterValue = (value: string): string[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

  return (
    <>
      <FilterHeader
        title={`${label} ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((memberId) => {
                  const member = getUserDetails(memberId);

                  if (!member) return null;
                  return (
                    <FilterOption
                      key={`members-${member.id}`}
                      isChecked={filterValue?.includes(member.id) ? true : false}
                      onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(member.id))}
                      icon={<Avatar name={member.display_name} src={member.avatar} showTooltip={false} size="md" />}
                      title={currentUser?.id === member.id ? "You" : member?.display_name}
                    />
                  );
                })}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs italic text-custom-text-400">No matches found</p>
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

"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane ui
import { Avatar } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// helpers
import { getFileURL  } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";

type TFilterUser = {
  filterTitle: string;
  searchQuery: string;
  appliedFilters: string[] | null;
  handleUpdate: (val: string[]) => void;
};

export const FilterUser: React.FC<TFilterUser> = observer((props) => {
  const { filterTitle = "Users", searchQuery, appliedFilters, handleUpdate } = props;
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // derived values
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const workspaceMembers = (workspaceMemberIds || [])
    .map((id) => {
      const member = getWorkspaceMemberDetails(id);
      if (member) {
        return member?.member;
      } else {
        return undefined;
      }
    })
    .filter((member) => member !== undefined);

  const sortedOptions = useMemo(
    () =>
      (workspaceMembers ?? []).filter(
        (member) =>
          (member?.display_name || "").includes(searchQuery.toLowerCase()) ||
          (member?.first_name || "").includes(searchQuery.toLowerCase()) ||
          (member?.last_name || "").includes(searchQuery.toLowerCase()) ||
          searchQuery === ""
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  const handleViewToggle = () => {
    if (!sortedOptions) return;
    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  const handleFilter = (val: string) => {
    if (appliedFilters?.includes(val)) {
      handleUpdate(appliedFilters.filter((priority) => priority !== val));
    } else {
      handleUpdate([...(appliedFilters ?? []), val]);
    }
  };

  return (
    <>
      <FilterHeader
        title={`${filterTitle}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions.length > 0 ? (
            <>
              {sortedOptions
                .slice(0, itemsToRender)
                .map(
                  (member) =>
                    member?.id &&
                    member.display_name && (
                      <FilterOption
                        key={member.id}
                        isChecked={appliedFilters?.includes(member.id) ? true : false}
                        onClick={() => member.id && handleFilter(member.id)}
                        icon={
                          <Avatar
                            name={member.display_name}
                            src={getFileURL(member.avatar_url)}
                            showTooltip={false}
                            size="md"
                          />
                        }
                        title={member.display_name.charAt(0).toUpperCase() + member.display_name.slice(1)}
                      />
                    )
                )}
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
          )}
        </div>
      )}
    </>
  );
});

import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Avatar, Loader } from "@plane/ui";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  memberIds: string[] | undefined;
  searchQuery: string;
};

export const FilterCreatedBy: React.FC<Props> = observer((props: Props) => {
  const { appliedFilters, handleUpdate, memberIds, searchQuery } = props;
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // store hooks
  const { getUserDetails } = useMember();

  const filteredOptions = memberIds?.filter((memberId) =>
    getUserDetails(memberId)?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`Created by${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, itemsToRender).map((memberId) => {
                  const member = getUserDetails(memberId);

                  if (!member) return null;
                  return (
                    <FilterOption
                      key={`created-by-${member.id}`}
                      isChecked={appliedFilters?.includes(member.id) ? true : false}
                      onClick={() => handleUpdate(member.id)}
                      icon={<Avatar name={member.display_name} src={member.avatar} size="md" />}
                      title={member.display_name}
                    />
                  );
                })}
                {filteredOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === filteredOptions.length ? "View less" : "View all"}
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

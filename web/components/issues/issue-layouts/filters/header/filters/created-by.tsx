import React, { useState } from "react";
// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Avatar, Loader } from "@plane/ui";
// types
import { IUserLite } from "types";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  members: IUserLite[] | undefined;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterCreatedBy: React.FC<Props> = (props) => {
  const { appliedFilters, handleUpdate, itemsToRender, members, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = members?.filter((member) =>
    member.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                {filteredOptions.slice(0, itemsToRender).map((member) => (
                  <FilterOption
                    key={`created-by-${member.id}`}
                    isChecked={appliedFilters?.includes(member.id) ? true : false}
                    onClick={() => handleUpdate(member.id)}
                    icon={<Avatar name={member.display_name} src={member.avatar} size="sm" />}
                    title={member.display_name}
                  />
                ))}
                {viewButtons}
              </>
            ) : (
              <p className="text-xs text-custom-text-400 italic">No matches found</p>
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
};

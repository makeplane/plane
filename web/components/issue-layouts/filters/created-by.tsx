import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// ui
import { Avatar, Loader } from "components/ui";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  projectId: string;
  searchQuery: string;
};

export const FilterCreatedBy: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, projectId, searchQuery } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { project: projectStore } = store;

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = projectStore.members?.[projectId?.toString() ?? ""]?.filter((member) =>
    member.member.display_name.toLowerCase().includes(searchQuery.toLowerCase())
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
              filteredOptions
                .slice(0, itemsToRender)
                .map((member) => (
                  <FilterOption
                    key={`created-by-${member.member?.id}`}
                    isChecked={appliedFilters?.includes(member.member?.id) ? true : false}
                    onClick={() => handleUpdate(member.member?.id)}
                    icon={<Avatar user={member.member} height="18px" width="18px" />}
                    title={member.member?.display_name}
                  />
                ))
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
});

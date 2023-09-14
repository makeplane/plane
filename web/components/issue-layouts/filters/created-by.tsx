import React from "react";
// components
import { MemberIcons } from "./assignees";
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterCreatedBy = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleFilter = (key: string, value: string) => {
    const _value =
      issueFilterStore?.userFilters?.filters?.[key] != null
        ? issueFilterStore?.userFilters?.filters?.[key].includes(value)
          ? issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value)
          : [...issueFilterStore?.userFilters?.filters?.[key], value]
        : [value];
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  return (
    <div>
      <FilterHeader
        title={`Created By (${issueFilterStore?.projectMembers?.length || 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.projectMembers &&
            issueFilterStore?.projectMembers.length > 0 &&
            issueFilterStore?.projectMembers.map((_member) => (
              <FilterOption
                key={`create-by-${_member?.member?.id}`}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.created_by != null &&
                  issueFilterStore?.userFilters?.filters?.created_by.includes(_member?.member?.id)
                    ? true
                    : false
                }
                onClick={() => handleFilter("created_by", _member?.member?.id)}
                icon={
                  <MemberIcons
                    display_name={_member?.member.display_name}
                    avatar={_member?.member.avatar}
                  />
                }
                title={`${_member?.member?.display_name} (${_member?.member?.first_name} ${_member?.member?.last_name})`}
              />
            ))}
        </div>
      )}
    </div>
  );
});

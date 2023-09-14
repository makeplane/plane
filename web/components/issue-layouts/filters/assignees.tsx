import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const MemberIcons = ({
  display_name,
  avatar,
}: {
  display_name: string;
  avatar: string | null;
}) => (
  <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
    {avatar ? (
      <img src={avatar} alt={display_name || ""} className="" />
    ) : (
      <div className="text-[12px] w-full h-full flex justify-center items-center capitalize font-medium bg-gray-700 text-white">
        {(display_name ?? "U")[0]}
      </div>
    )}
  </div>
);

export const FilterAssignees = observer(() => {
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
        title={`Assignees (${issueFilterStore?.projectMembers?.length || 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.projectMembers &&
            issueFilterStore?.projectMembers.length > 0 &&
            issueFilterStore?.projectMembers.map((_member) => (
              <FilterOption
                key={`assignees-${_member?.member?.id}`}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.assignees != null &&
                  issueFilterStore?.userFilters?.filters?.assignees.includes(_member?.member?.id)
                    ? true
                    : false
                }
                onClick={() => handleFilter("assignees", _member?.member?.id)}
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

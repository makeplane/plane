import React from "react";
// components
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const MemberIcons = ({ display_name, avatar }: { display_name: string; avatar: string | null }) => (
  <div className="flex-shrink-0 rounded-sm overflow-hidden w-[16px] h-[16px] flex justify-center items-center">
    {avatar ? (
      <img src={avatar} alt={display_name || ""} className="" />
    ) : (
      <div className="text-xs w-full h-full flex justify-center items-center capitalize font-medium bg-gray-700 text-white">
        {(display_name ?? "U")[0]}
      </div>
    )}
  </div>
);

export const FilterAssignees = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleFilter = (key: string, value: string) => {
    let _value =
      issueFilterStore?.userFilters?.filters?.[key] != null &&
      issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value);
    _value = _value && _value.length > 0 ? _value : null;
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  const clearFilter = () => {
    issueFilterStore.handleUserFilter("filters", "assignees", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.assignees != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader
              title={`Assignees (${issueFilterStore?.userFilters?.filters?.assignees?.length || 0})`}
            />
          </div>
          <div className="relative flex items-center flex-wrap gap-2">
            {issueFilterStore?.projectMembers &&
              issueFilterStore?.projectMembers.length > 0 &&
              issueFilterStore?.projectMembers.map(
                (_member) =>
                  issueFilterStore?.userFilters?.filters?.assignees != null &&
                  issueFilterStore?.userFilters?.filters?.assignees.includes(_member?.member?.id) && (
                    <FilterPreviewContent
                      key={`assignees-${_member?.member?.id}`}
                      icon={<MemberIcons display_name={_member?.member.display_name} avatar={_member?.member.avatar} />}
                      title={`${_member?.member?.display_name}`}
                      onClick={() => handleFilter("assignees", _member?.member?.id)}
                      className="border border-custom-border-100 bg-custom-background-100"
                    />
                  )
              )}
            <div className="flex-shrink-0">
              <FilterPreviewClear onClick={clearFilter} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

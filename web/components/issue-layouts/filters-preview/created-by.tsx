import React from "react";
// components
import { MemberIcons } from "./assignees";
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterCreatedBy = observer(() => {
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
    issueFilterStore.handleUserFilter("filters", "created_by", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.created_by != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader
              title={`Created By (${issueFilterStore?.userFilters?.filters?.created_by?.length || 0})`}
            />
          </div>

          <div className="relative flex items-center flex-wrap gap-2">
            {issueFilterStore?.projectMembers &&
              issueFilterStore?.projectMembers.length > 0 &&
              issueFilterStore?.projectMembers.map(
                (_member) =>
                  issueFilterStore?.userFilters?.filters?.created_by != null &&
                  issueFilterStore?.userFilters?.filters?.created_by.includes(_member?.member?.id) && (
                    <FilterPreviewContent
                      key={`create-by-${_member?.member?.id}`}
                      title={`${_member?.member?.display_name}`}
                      icon={<MemberIcons display_name={_member?.member.display_name} avatar={_member?.member.avatar} />}
                      onClick={() => handleFilter("created_by", _member?.member?.id)}
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

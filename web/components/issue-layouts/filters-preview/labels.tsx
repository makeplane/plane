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

const LabelIcons = ({ color }: { color: string }) => (
  <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
    <div className={`w-[12px] h-[12px] rounded-full`} style={{ backgroundColor: color }} />
  </div>
);

export const FilterLabels = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const stateStyles = (color: any) => ({ color: color, backgroundColor: `${color}20` });

  const handleFilter = (key: string, value: string) => {
    let _value =
      issueFilterStore?.userFilters?.filters?.[key] != null &&
      issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value);
    _value = _value && _value.length > 0 ? _value : null;
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  const clearFilter = () => {
    issueFilterStore.handleUserFilter("filters", "labels", null);
  };

  const handleLabels =
    issueFilterStore.issueView && issueFilterStore.issueView === "my_issues"
      ? issueFilterStore?.workspaceLabels
      : issueFilterStore?.projectLabels;

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.labels != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader title={`Labels (${issueFilterStore?.userFilters?.filters?.labels?.length || 0})`} />
          </div>

          <div className="relative flex items-center flex-wrap gap-2">
            {handleLabels &&
              handleLabels.length > 0 &&
              handleLabels.map(
                (_label) =>
                  issueFilterStore?.userFilters?.filters?.labels != null &&
                  issueFilterStore?.userFilters?.filters?.labels.includes(_label?.id) && (
                    <FilterPreviewContent
                      key={_label?.id}
                      onClick={() => handleFilter("labels", _label?.id)}
                      icon={<LabelIcons color={_label.color} />}
                      title={_label.name}
                      style={stateStyles(_label.color)}
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

import React from "react";
// lucide icons
import { AlertCircle, SignalHigh, SignalMedium, SignalLow, Ban } from "lucide-react";
// components
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const PriorityIcons = ({ priority }: { priority: string }) => {
  if (priority === "urgent") return <AlertCircle size={12} strokeWidth={2} />;
  if (priority === "high") return <SignalHigh size={12} strokeWidth={4} />;
  if (priority === "medium") return <SignalMedium size={12} strokeWidth={4} />;
  if (priority === "low") return <SignalLow size={12} strokeWidth={4} />;
  return <Ban size={12} strokeWidth={2} />;
};

const classNamesStyling = (priority: string) => {
  if (priority == "urgent") return "bg-red-500/20 text-red-500";
  if (priority == "high") return "bg-orange-500/20 text-orange-500 !-pt-[30px]";
  if (priority == "medium") return "bg-orange-500/20 text-orange-500 -pt-2";
  if (priority == "low") return "bg-green-500/20 text-green-500 -pt-2";
  return "bg-gray-500/10 text-gray-500";
};

export const FilterPriority = observer(() => {
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
    issueFilterStore.handleUserFilter("filters", "priority", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.priority != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader
              title={`Priority (${issueFilterStore?.userFilters?.filters?.priority?.length || 0})`}
            />
          </div>
          <div className="relative flex items-center flex-wrap gap-2">
            {issueFilterStore?.issueRenderFilters?.priority &&
              issueFilterStore?.issueRenderFilters?.priority.length > 0 &&
              issueFilterStore?.issueRenderFilters?.priority.map(
                (_priority) =>
                  issueFilterStore?.userFilters?.filters?.priority != null &&
                  issueFilterStore?.userFilters?.filters?.priority.includes(_priority?.key) && (
                    <FilterPreviewContent
                      key={_priority?.key}
                      icon={<PriorityIcons priority={_priority.key} />}
                      title={_priority.title}
                      className={classNamesStyling(_priority?.key)}
                      onClick={() => handleFilter("priority", _priority?.key)}
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

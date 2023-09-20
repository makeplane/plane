import React from "react";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { ISSUE_ORDER_BY_OPTIONS } from "constants/issue";

export const FilterOrderBy = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const handleOrderBy = (key: string, value: string) => {
    // issueFilterStore.handleUserFilter("display_filters", key, value);
  };

  return (
    <div>
      <FilterHeader
        title={"Order By"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {ISSUE_ORDER_BY_OPTIONS.map((_orderBy) => (
            <FilterOption
              key={_orderBy?.key}
              isChecked={issueFilterStore?.userDisplayFilters?.order_by === _orderBy?.key ? true : false}
              onClick={() => handleOrderBy("order_by", _orderBy?.key)}
              title={_orderBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});

import React from "react";
import { observer } from "mobx-react";
// components
import { INITIATIVE_GROUP_BY_OPTIONS, INITIATIVE_ORDER_BY_OPTIONS } from "@/plane-web/constants/initiative";
import { TInitiativeDisplayFilters } from "@/plane-web/types/initiative";
import { FilterGroupBy, FilterOrderBy } from "./";
// Plane-web

type Props = {
  displayFilters: TInitiativeDisplayFilters | undefined;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<TInitiativeDisplayFilters>) => void;
};

export const DisplayFiltersSelection: React.FC<Props> = observer((props) => {
  const { displayFilters, handleDisplayFiltersUpdate } = props;

  return (
    <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5">
      {/* group by */}
      <div className="py-2">
        <FilterGroupBy
          displayFilters={displayFilters}
          groupByOptions={INITIATIVE_GROUP_BY_OPTIONS.map((option) => option.key)}
          handleUpdate={(val) =>
            handleDisplayFiltersUpdate({
              group_by: val,
            })
          }
        />
      </div>

      {/* order by */}
      <div className="py-2">
        <FilterOrderBy
          selectedOrderBy={displayFilters?.order_by}
          handleUpdate={(val) =>
            handleDisplayFiltersUpdate({
              order_by: val,
            })
          }
          orderByOptions={INITIATIVE_ORDER_BY_OPTIONS.map((option) => option.key)}
        />
      </div>
    </div>
  );
});

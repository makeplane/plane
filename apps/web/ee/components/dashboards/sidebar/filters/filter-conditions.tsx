import { observer } from "mobx-react";
import { IFilterInstance } from "@plane/shared-state";
import { TExternalDashboardWidgetFilterExpression, TDashboardWidgetFilterKeys } from "@plane/types";
import { FilterItem } from "@/components/rich-filters/filter-item";

type Props = {
  filters: IFilterInstance<TDashboardWidgetFilterKeys, TExternalDashboardWidgetFilterExpression>;
};

export const FilterConditions: React.FC<Props> = observer(({ filters }) => (
  <div className="flex flex-col items-start">
    {filters.allConditionsForDisplay.map((condition, index) => (
      <div key={condition.id} className="flex flex-col items-start">
        <FilterItem filter={filters} condition={condition} showTransition={false} />

        {index < filters.allConditionsForDisplay.length - 1 && (
          <div className="flex flex-col items-center">
            <div className="h-2 border-l border-dashed border-custom-border-300" />
            <span className="text-xs font-medium uppercase text-custom-text-400 px-2 py-0.5 bg-custom-background-80 rounded-sm">
              And
            </span>
            <div className="h-2 border-l border-dashed border-custom-border-300" />
          </div>
        )}
      </div>
    ))}
  </div>
));

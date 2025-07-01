import { FC, useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { SlidersHorizontal } from "lucide-react";
import { IIssueDisplayFilterOptions, ILayoutDisplayFiltersOptions, IIssueDisplayProperties } from "@plane/types";
import { cn } from "@plane/utils";
import { FilterDisplayProperties, FilterGroupBy, FilterOrderBy, FiltersDropdown } from "@/components/issues";
import { isDisplayFiltersApplied } from "@/components/issues/issue-layouts/utils";

type TSubIssueDisplayFiltersProps = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
  isEpic?: boolean;
};

export const SubIssueDisplayFilters: FC<TSubIssueDisplayFiltersProps> = observer((props) => {
  const {
    isEpic = false,
    displayProperties,
    layoutDisplayFiltersOptions,
    handleDisplayPropertiesUpdate,
    handleDisplayFiltersUpdate,
    displayFilters,
  } = props;

  const isFilterApplied = useMemo(
    () => isDisplayFiltersApplied({ displayProperties, displayFilters }),
    [displayProperties, displayFilters]
  );

  return (
    <>
      {layoutDisplayFiltersOptions?.display_filters && layoutDisplayFiltersOptions?.display_properties.length > 0 && (
        <FiltersDropdown
          placement="bottom-end"
          menuButton={
            <div
              className={cn(
                "p-1 rounded  relative transition-all duration-200",
                isFilterApplied && "bg-custom-primary-60/20"
              )}
            >
              {isFilterApplied && <span className="p-1 rounded-full bg-custom-primary-100 absolute -top-1 -right-1" />}
              <SlidersHorizontal className="h-3.5 w-3.5 text-custom-text-100" />
            </div>
          }
        >
          <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5 max-h-[25rem] text-left">
            {/* display properties */}
            <div className="py-2">
              <FilterDisplayProperties
                displayProperties={displayProperties}
                displayPropertiesToRender={layoutDisplayFiltersOptions.display_properties}
                handleUpdate={handleDisplayPropertiesUpdate}
                isEpic={isEpic}
              />
            </div>

            {/* group by */}
            <div className="py-2">
              <FilterGroupBy
                displayFilters={displayFilters}
                groupByOptions={layoutDisplayFiltersOptions?.display_filters.group_by ?? []}
                handleUpdate={(val) =>
                  handleDisplayFiltersUpdate({
                    group_by: val,
                  })
                }
                ignoreGroupedFilters={[]}
              />
            </div>

            {/* order by */}
            {!isEmpty(layoutDisplayFiltersOptions?.display_filters?.order_by) && (
              <div className="py-2">
                <FilterOrderBy
                  selectedOrderBy={displayFilters?.order_by}
                  handleUpdate={(val) =>
                    handleDisplayFiltersUpdate({
                      order_by: val,
                    })
                  }
                  orderByOptions={layoutDisplayFiltersOptions?.display_filters.order_by ?? []}
                />
              </div>
            )}
          </div>
        </FiltersDropdown>
      )}
    </>
  );
});

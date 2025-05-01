import { FC } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { IIssueDisplayFilterOptions, ILayoutDisplayFiltersOptions, IIssueDisplayProperties } from "@plane/types";
import { DisplayPropertiesIcon } from "@plane/ui";
import { FilterDisplayProperties, FilterOrderBy, FiltersDropdown } from "@/components/issues";

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

  return (
    <>
      {layoutDisplayFiltersOptions?.display_filters && layoutDisplayFiltersOptions?.display_properties.length > 0 && (
        <FiltersDropdown
          placement="bottom-end"
          menuButton={<DisplayPropertiesIcon className="h-3.5 w-3.5 text-custom-text-100" />}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-custom-border-200 overflow-hidden overflow-y-auto px-2.5 max-h-[25rem] text-left"
          >
            {/* display properties */}
            <div className="py-2">
              <FilterDisplayProperties
                displayProperties={displayProperties}
                displayPropertiesToRender={layoutDisplayFiltersOptions.display_properties}
                handleUpdate={handleDisplayPropertiesUpdate}
                isEpic={isEpic}
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

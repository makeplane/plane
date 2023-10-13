import React from "react";
import { observer } from "mobx-react-lite";

// components
import {
  FilterDisplayProperties,
  FilterExtraOptions,
  FilterGroupBy,
  FilterIssueType,
  FilterOrderBy,
  FilterSubGroupBy,
} from "components/issues";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "types";
import { ILayoutDisplayFiltersOptions } from "constants/issue";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
};

export const DisplayFiltersSelection: React.FC<Props> = observer((props) => {
  const {
    displayFilters,
    displayProperties,
    handleDisplayFiltersUpdate,
    handleDisplayPropertiesUpdate,
    layoutDisplayFiltersOptions,
  } = props;

  const isDisplayFilterEnabled = (displayFilter: keyof IIssueDisplayFilterOptions) =>
    Object.keys(layoutDisplayFiltersOptions?.display_filters ?? {}).includes(displayFilter);

  return (
    <div className="w-full h-full overflow-hidden overflow-y-auto relative px-2.5 divide-y divide-custom-border-200">
      {/* display properties */}
      {layoutDisplayFiltersOptions?.display_properties && (
        <div className="py-2">
          <FilterDisplayProperties displayProperties={displayProperties} handleUpdate={handleDisplayPropertiesUpdate} />
        </div>
      )}

      {/* group by */}
      {isDisplayFilterEnabled("group_by") && (
        <div className="py-2">
          <FilterGroupBy
            selectedGroupBy={displayFilters.group_by}
            selectedSubGroupBy={displayFilters.sub_group_by}
            groupByOptions={layoutDisplayFiltersOptions?.display_filters.group_by ?? []}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                group_by: val,
              })
            }
          />
        </div>
      )}

      {/* sub-group by */}
      {isDisplayFilterEnabled("sub_group_by") &&
        displayFilters.group_by !== null &&
        displayFilters.layout === "kanban" && (
          <div className="py-2">
            <FilterSubGroupBy
              selectedGroupBy={displayFilters.group_by}
              selectedSubGroupBy={displayFilters.sub_group_by}
              handleUpdate={(val) =>
                handleDisplayFiltersUpdate({
                  sub_group_by: val,
                })
              }
              subGroupByOptions={layoutDisplayFiltersOptions?.display_filters.sub_group_by ?? []}
            />
          </div>
        )}

      {/* order by */}
      {isDisplayFilterEnabled("order_by") && (
        <div className="py-2">
          <FilterOrderBy
            selectedOrderBy={displayFilters.order_by}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                order_by: val,
              })
            }
            orderByOptions={layoutDisplayFiltersOptions?.display_filters.order_by ?? []}
          />
        </div>
      )}

      {/* issue type */}
      {isDisplayFilterEnabled("type") && (
        <div className="py-2">
          <FilterIssueType
            selectedIssueType={displayFilters.type}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                type: val,
              })
            }
          />
        </div>
      )}

      {/* Options */}
      {layoutDisplayFiltersOptions?.extra_options.access && (
        <div className="py-2">
          <FilterExtraOptions
            selectedExtraOptions={{
              show_empty_groups: displayFilters.show_empty_groups ?? false,
              sub_issue: displayFilters.sub_issue ?? false,
            }}
            handleUpdate={(key, val) =>
              handleDisplayFiltersUpdate({
                [key]: val,
              })
            }
            enabledExtraOptions={layoutDisplayFiltersOptions?.extra_options.values}
          />
        </div>
      )}
    </div>
  );
});

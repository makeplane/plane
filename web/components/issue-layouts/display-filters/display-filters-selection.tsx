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
} from "components/issue-layouts";
// types
import { IIssueDisplayFilterOptions } from "types";
import { ILayoutDisplayFiltersOptions } from "constants/issue";

type Props = {
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions;
};

export const DisplayFiltersSelection: React.FC<Props> = observer((props) => {
  const { displayFilters, handleDisplayFiltersUpdate, layoutDisplayFiltersOptions } = props;

  const isDisplayFilterEnabled = (displayFilter: string) =>
    layoutDisplayFiltersOptions.display_filters[displayFilters.layout ?? "list"].includes(displayFilter);

  return (
    <div className="w-full h-full overflow-hidden overflow-y-auto relative px-2.5 divide-y divide-custom-border-200">
      {/* display properties */}
      {layoutDisplayFiltersOptions.display_properties[displayFilters.layout ?? "list"] && (
        <div className="py-2">
          <FilterDisplayProperties />
        </div>
      )}

      {/* group by */}
      {isDisplayFilterEnabled("group_by") && (
        <div className="py-2">
          <FilterGroupBy
            selectedGroupBy={displayFilters.group_by}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                group_by: val,
              })
            }
          />
        </div>
      )}

      {/* sub-group by */}
      {isDisplayFilterEnabled("sub_group_by") && (
        <div className="py-2">
          <FilterSubGroupBy
            selectedGroupBy={displayFilters.group_by}
            selectedSubGroupBy={displayFilters.sub_group_by}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                sub_group_by: val,
              })
            }
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
          />
        </div>
      )}

      {/* issue type */}
      {isDisplayFilterEnabled("issue_type") && (
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
      {layoutDisplayFiltersOptions.extra_options[displayFilters.layout ?? "list"].access && (
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
            enabledExtraOptions={layoutDisplayFiltersOptions.extra_options[displayFilters.layout ?? "list"].values}
          />
        </div>
      )}
    </div>
  );
});

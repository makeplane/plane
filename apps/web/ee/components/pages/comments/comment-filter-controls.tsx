import React from "react";
import { observer } from "mobx-react";
import { Filter } from "lucide-react";
import { CustomMenu, Checkbox } from "@plane/ui";

export type CommentFiltersProps = {
  filters: {
    showAll: boolean;
    showActive: boolean;
    showResolved: boolean;
  };
  onFilterChange: (filterKey: "showAll" | "showActive" | "showResolved") => void;
};

export const PageCommentFilterControls = observer(({ filters, onFilterChange }: CommentFiltersProps) => (
  <CustomMenu
    customButton={
      <div className="flex h-6 items-center border border-custom-border-200 rounded hover:border-custom-border-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        <div className="flex h-6 px-2 items-center gap-1">
          <Filter className="w-3 h-3 text-custom-text-300" />
          <span className="text-custom-text-300 text-[11px] font-medium leading-[14px]">Filters</span>
        </div>
      </div>
    }
    placement="bottom-end"
    closeOnSelect={false}
  >
    <div className="p-2 min-w-[180px]">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-all-main"
            checked={filters.showAll}
            onChange={() => onFilterChange("showAll")}
            className="size-3.5"
          />
          <label htmlFor="show-all-main" className="text-sm cursor-pointer">
            Show all
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-active-main"
            checked={filters.showActive}
            onChange={() => onFilterChange("showActive")}
            className="size-3.5"
          />
          <label htmlFor="show-active-main" className="text-sm cursor-pointer">
            Show active
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-resolved-main"
            checked={filters.showResolved}
            onChange={() => onFilterChange("showResolved")}
            className="size-3.5"
          />
          <label htmlFor="show-resolved-main" className="text-sm cursor-pointer">
            Show resolved
          </label>
        </div>
      </div>
    </div>
  </CustomMenu>
));

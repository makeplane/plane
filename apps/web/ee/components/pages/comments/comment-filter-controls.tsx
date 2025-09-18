import React from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { CustomMenu, Checkbox } from "@plane/ui";

export type CommentFiltersProps = {
  filters: {
    showAll: boolean;
    showActive: boolean;
    showResolved: boolean;
  };
  onFilterChange: (filterKey: "showAll" | "showActive" | "showResolved") => void;
};

export const PageCommentFilterControls = observer(({ filters, onFilterChange }: CommentFiltersProps) => {
  const isFiltersApplied = filters.showActive || filters.showResolved;

  return (
    <CustomMenu
      customButton={
        <div className="relative flex h-6 items-center border border-custom-border-200 rounded hover:border-custom-border-300 transition-colors">
          <div className="flex h-6 px-2 items-center gap-1">
            <ListFilter className="size-3 text-custom-text-300" />
            <span className="text-custom-text-300 text-[11px] font-medium leading-[14px]">Filters</span>
          </div>
          {isFiltersApplied && (
            <span className="absolute h-1.5 w-1.5 right-0 top-0 translate-x-1/2 -translate-y-1/2 bg-custom-primary-100 rounded-full" />
          )}
        </div>
      }
      placement="bottom-end"
      closeOnSelect={false}
    >
      <CustomMenu.MenuItem onClick={() => onFilterChange("showActive")} className="flex items-center gap-2">
        <Checkbox
          id="show-active-main"
          checked={filters.showActive}
          className="size-3.5 border-custom-border-400"
          readOnly
        />
        <span className="text-sm">Show active</span>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => onFilterChange("showResolved")} className="flex items-center gap-2">
        <Checkbox
          id="show-resolved-main"
          checked={filters.showResolved}
          className="size-3.5 border-custom-border-400"
          readOnly
        />
        <span className="text-sm">Show resolved</span>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => onFilterChange("showAll")} className="flex items-center gap-2">
        <Checkbox id="show-all-main" checked={filters.showAll} className="size-3.5 border-custom-border-400" readOnly />
        <span className="text-sm">Show all</span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
});

"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { TRecentActivityWidgetFilters } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

export type TFiltersDropdown = {
  className?: string;
  activeFilter: TRecentActivityWidgetFilters | undefined;
  setActiveFilter: (filter: TRecentActivityWidgetFilters) => void;
};

const filters = ["all", "projects", "pages", "issues"];
export const FiltersDropdown: FC<TFiltersDropdown> = observer((props) => {
  const { className, activeFilter, setActiveFilter } = props;

  const DropdownOptions = () =>
    filters?.map((filter) => (
      <CustomMenu.MenuItem
        key={filter}
        className="flex items-center gap-2 truncate"
        onClick={() => {
          setActiveFilter(filter);
        }}
      >
        <div className="truncate font-medium text-xs capitalize">{filter}</div>
      </CustomMenu.MenuItem>
    ));

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-xs text-custom-text-200 w-fit ", className)}
      placement="bottom-start"
      customButton={
        <button className="flex hover:bg-custom-background-80 px-2 py-1 rounded gap-1 capitalize border border-custom-border-200">
          <span className="font-medium text-sm my-auto"> {activeFilter && `${activeFilter}`}</span>
          <ChevronDown className={cn("size-3 my-auto text-custom-text-300 hover:text-custom-text-200 duration-300")} />
        </button>
      }
      customButtonClassName="flex justify-center"
      closeOnSelect
    >
      <DropdownOptions />
    </CustomMenu>
  );
});

"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { TRecentActivityFilterKeys } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

export type TFiltersDropdown = {
  className?: string;
  activeFilter: TRecentActivityFilterKeys;
  setActiveFilter: (filter: TRecentActivityFilterKeys) => void;
  filters: { name: TRecentActivityFilterKeys; icon?: React.ReactNode }[];
};

export const FiltersDropdown: FC<TFiltersDropdown> = observer((props) => {
  const { className, activeFilter, setActiveFilter, filters } = props;

  const DropdownOptions = () =>
    filters?.map((filter) => (
      <CustomMenu.MenuItem
        key={filter.name}
        className="flex items-center gap-2 truncate text-custom-text-200"
        onClick={() => {
          setActiveFilter(filter.name);
        }}
      >
        {filter.icon && <div>{filter.icon}</div>}
        <div className="truncate font-medium text-xs capitalize">{`${filter.name}s`}</div>
      </CustomMenu.MenuItem>
    ));

  return (
    <CustomMenu
      maxHeight={"md"}
      className={cn("flex justify-center text-xs text-custom-text-200 w-fit ", className)}
      placement="bottom-start"
      customButton={
        <button className="flex hover:bg-custom-background-80 px-2 py-1 rounded gap-1 capitalize border border-custom-border-200">
          <span className="font-medium text-sm my-auto"> {activeFilter && `${activeFilter}s`}</span>
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

"use client";

import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
// types
import { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// constants
import { VIEW_SORTING_KEY_OPTIONS } from "@/constants/views";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  onChange: (value: { key?: TViewFiltersSortKey; order?: TViewFiltersSortBy }) => void;
  sortBy: TViewFiltersSortBy;
  sortKey: TViewFiltersSortKey;
};

export const ViewOrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, sortBy, sortKey } = props;

  const orderByDetails = VIEW_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  const sortByOptions = [
    { key: "asc", label: "Ascending", isSelected: !isDescending },
    { key: "desc", label: "Descending", isSelected: isDescending },
  ];

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
          <ArrowDownWideNarrow className="h-3 w-3" />
          {orderByDetails?.label}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      {VIEW_SORTING_KEY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() =>
            onChange({
              key: option.key,
            })
          }
        >
          {option.label}
          {sortKey === option.key && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-custom-border-200" />
      {sortByOptions.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => {
            if (!option.isSelected)
              onChange({
                order: option.key as TViewFiltersSortBy,
              });
          }}
        >
          {option.label}
          {option.isSelected && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
};

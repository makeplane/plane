"use client";

import { ArrowDownWideNarrow, ArrowUpWideNarrow, Check, ChevronDown } from "lucide-react";
// types
import { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// constants
import { VIEW_SORTING_KEY_OPTIONS } from "@/constants/views";

type Props = {
  onChange: (value: { key?: TViewFiltersSortKey; order?: TViewFiltersSortBy }) => void;
  sortBy: TViewFiltersSortBy;
  sortKey: TViewFiltersSortKey;
  isMobile?: boolean;
};

export const ViewOrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, sortBy, sortKey, isMobile = false } = props;

  const orderByDetails = VIEW_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  const sortByOptions = [
    { key: "asc", label: "Ascending", isSelected: !isDescending },
    { key: "desc", label: "Descending", isSelected: isDescending },
  ];

  const buttonClassName = isMobile
    ? "flex items-center text-sm text-custom-text-200 gap-2 w-full"
    : `${getButtonStyling("neutral-primary", "sm")} px-2 text-custom-text-300`;

  const chevronClassName = isMobile ? "h-4 w-4 text-custom-text-200" : "h-3 w-3";
  const icon = (
    <>{!isDescending ? <ArrowUpWideNarrow className="size-3 " /> : <ArrowDownWideNarrow className="size-3 " />}</>
  );
  return (
    <CustomMenu
      customButton={
        <span className={buttonClassName}>
          {!isMobile && icon}
          <span className="flex-shrink-0"> {orderByDetails?.label}</span>
          <ChevronDown className={chevronClassName} strokeWidth={2} />
        </span>
      }
      placement="bottom-end"
      className="w-full flex justify-center"
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

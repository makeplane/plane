"use client";

import { ArrowDownWideNarrow, ArrowUpWideNarrow, Check, ChevronDown } from "lucide-react";
// types
import { VIEW_SORT_BY_OPTIONS, VIEW_SORTING_KEY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
// ui
import { CustomMenu, getButtonStyling } from "@plane/ui";
// constants

type Props = {
  onChange: (value: { key?: TViewFiltersSortKey; order?: TViewFiltersSortBy }) => void;
  sortBy: TViewFiltersSortBy;
  sortKey: TViewFiltersSortKey;
  isMobile?: boolean;
};

export const ViewOrderByDropdown: React.FC<Props> = (props) => {
  const { onChange, sortBy, sortKey, isMobile = false } = props;
  const { t } = useTranslation();

  const orderByDetails = VIEW_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

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
          <span className="flex-shrink-0"> {orderByDetails?.i18n_label && t(orderByDetails?.i18n_label)}</span>
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
              key: option.key as TViewFiltersSortKey,
            })
          }
        >
          {t(option.i18n_label)}
          {sortKey === option.key && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-custom-border-200" />
      {VIEW_SORT_BY_OPTIONS.map((option) => {
        const isSelected = (option.key === "asc" && !isDescending) || (option.key === "desc" && isDescending);
        return (
          <CustomMenu.MenuItem
            key={option.key}
            className="flex items-center justify-between gap-2"
            onClick={() => {
              if (!isSelected)
                onChange({
                  order: option.key as TViewFiltersSortBy,
                });
            }}
          >
            {t(option.i18n_label)}
            {isSelected && <Check className="h-3 w-3" />}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
};

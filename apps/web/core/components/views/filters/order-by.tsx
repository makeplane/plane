import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
// plane imports
import { VIEW_SORT_BY_OPTIONS, VIEW_SORTING_KEY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { TViewFiltersSortBy, TViewFiltersSortKey } from "@plane/types";
import { CustomMenu } from "@plane/ui";

type Props = {
  onChange: (value: { key?: TViewFiltersSortKey; order?: TViewFiltersSortBy }) => void;
  sortBy: TViewFiltersSortBy;
  sortKey: TViewFiltersSortKey;
  isMobile?: boolean;
};

export function ViewOrderByDropdown(props: Props) {
  const { onChange, sortBy, sortKey, isMobile = false } = props;
  const { t } = useTranslation();

  const orderByDetails = VIEW_SORTING_KEY_OPTIONS.find((option) => sortKey === option.key);
  const isDescending = sortBy === "desc";

  const buttonClassName = isMobile
    ? "flex items-center text-13 text-secondary gap-2 w-full"
    : getButtonStyling("secondary", "lg");

  const icon = (
    <>{!isDescending ? <ArrowUpWideNarrow className="size-3 " /> : <ArrowDownWideNarrow className="size-3 " />}</>
  );
  return (
    <CustomMenu
      customButton={
        <span className={buttonClassName}>
          {!isMobile && icon}
          <span className="shrink-0"> {orderByDetails?.i18n_label && t(orderByDetails?.i18n_label)}</span>
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
          {sortKey === option.key && <CheckIcon className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-subtle" />
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
            {isSelected && <CheckIcon className="h-3 w-3" />}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
}

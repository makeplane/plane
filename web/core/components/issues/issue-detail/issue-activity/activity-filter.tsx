import React, { FC } from "react";
import { observer } from "mobx-react";
import { Check, ListFilter } from "lucide-react";
import { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, PopoverMenu } from "@plane/ui";
// helper
import { cn } from "@plane/utils";
// constants

type TActivityFilter = {
  selectedFilters: TActivityFilters[];
  filterOptions: TActivityFilterOption[];
};

export const ActivityFilter: FC<TActivityFilter> = observer((props) => {
  const { selectedFilters = [], filterOptions } = props;

  // hooks
  const { t } = useTranslation();

  return (
    <PopoverMenu
      buttonClassName="outline-none"
      button={
        <Button
          variant="neutral-primary"
          size="sm"
          prependIcon={<ListFilter className="h-3 w-3" />}
          className="relative"
        >
          <span className="text-custom-text-200">{t("common.filters")}</span>
          {selectedFilters.length < filterOptions.length && (
            <span className="absolute h-2 w-2 -right-0.5 -top-0.5 bg-custom-primary-100 rounded-full" />
          )}
        </Button>
      }
      panelClassName="p-2 rounded-md border border-custom-border-200 bg-custom-background-100"
      data={filterOptions}
      keyExtractor={(item) => item.key}
      render={(item) => (
        <div
          key={item.key}
          className="flex items-center gap-2 text-sm cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
          onClick={item.onClick}
        >
          <div
            className={cn(
              "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all bg-custom-background-90",
              {
                "bg-custom-primary text-white": item.isSelected,
                "bg-custom-background-80 text-custom-text-400": item.isSelected && selectedFilters.length === 1,
                "bg-custom-background-90": !item.isSelected,
              }
            )}
          >
            {item.isSelected && <Check className="h-2.5 w-2.5" />}
          </div>
          <div className={cn("whitespace-nowrap", item.isSelected ? "text-custom-text-100" : "text-custom-text-200")}>
            {t(item.labelTranslationKey)}
          </div>
        </div>
      )}
    />
  );
});

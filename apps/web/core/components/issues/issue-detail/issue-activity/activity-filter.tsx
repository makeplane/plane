import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import type { TActivityFilters, TActivityFilterOption } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { CheckIcon } from "@plane/propel/icons";
import { PopoverMenu } from "@plane/ui";
// helper
import { cn } from "@plane/utils";
// constants

type TActivityFilter = {
  selectedFilters: TActivityFilters[];
  filterOptions: TActivityFilterOption[];
};

export const ActivityFilter = observer(function ActivityFilter(props: TActivityFilter) {
  const { selectedFilters = [], filterOptions } = props;

  // hooks
  const { t } = useTranslation();

  return (
    <PopoverMenu
      buttonClassName="outline-none"
      button={
        <>
          <IconButton variant="tertiary" icon={ListFilter} />
          {selectedFilters.length < filterOptions.length && (
            <span className="absolute h-2 w-2 -right-0.5 -top-0.5 bg-accent-primary rounded-full" />
          )}
        </>
      }
      panelClassName="p-2 rounded-md border border-subtle bg-surface-1"
      data={filterOptions}
      keyExtractor={(item) => item.key}
      render={(item) => (
        <div
          key={item.key}
          className="flex items-center gap-2 text-13 cursor-pointer px-2 p-1 transition-all hover:bg-layer-1 rounded-xs"
          onClick={item.onClick}
        >
          <div
            className={cn(
              "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-xs transition-all bg-surface-2",
              {
                "bg-accent-primary text-on-color": item.isSelected,
                "bg-layer-1 text-placeholder": item.isSelected && selectedFilters.length === 1,
                "bg-surface-2": !item.isSelected,
              }
            )}
          >
            {item.isSelected && <CheckIcon className="h-2.5 w-2.5" />}
          </div>
          <div className={cn("whitespace-nowrap", item.isSelected ? "text-primary" : "text-secondary")}>
            {t(item.labelTranslationKey)}
          </div>
        </div>
      )}
    />
  );
});

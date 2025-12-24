import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/propel/utils";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
// local imports
import { AddFilterDropdown } from "../add-filters/dropdown";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../shared";

interface IFilterItemPropertyProps<P extends TFilterProperty, E extends TExternalFilter> {
  conditionId: string;
  icon: React.FC<React.SVGAttributes<SVGElement>> | undefined;
  isDisabled?: boolean;
  filter: IFilterInstance<P, E>;
  label: string;
  tooltipContent?: React.ReactNode | undefined;
}

export const FilterItemProperty = observer(function FilterItemProperty<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: IFilterItemPropertyProps<P, E>) {
  const { conditionId, filter, isDisabled } = props;

  if (isDisabled) {
    return <PropertyButton {...props} />;
  }

  const handleFilterSelect = (property: P, operator: TSupportedOperators, isNegation: boolean) => {
    filter.updateConditionProperty(conditionId, property, operator, isNegation);
  };

  return (
    <AddFilterDropdown
      {...props}
      handleFilterSelect={handleFilterSelect}
      customButton={<PropertyButton {...props} />}
    />
  );
});

type TPropertyButtonProps<P extends TFilterProperty, E extends TExternalFilter> = IFilterItemPropertyProps<P, E> & {
  className?: string;
};

function PropertyButton<P extends TFilterProperty, E extends TExternalFilter>(props: TPropertyButtonProps<P, E>) {
  const { icon: Icon, label, tooltipContent, className } = props;

  return (
    <Tooltip tooltipContent={tooltipContent} position="bottom-start" disabled={!tooltipContent}>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-[5px] text-11 text-tertiary min-w-0 h-full",
          COMMON_FILTER_ITEM_BORDER_CLASSNAME,
          className
        )}
      >
        {Icon && (
          <div className="transition-transform duration-200 ease-in-out flex-shrink-0">
            <Icon className="size-3.5" />
          </div>
        )}
        <span className="truncate">{label}</span>
      </div>
    </Tooltip>
  );
}

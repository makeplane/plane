import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/propel/utils";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../shared";

interface IFilterItemPropertyProps {
  icon: React.FC<React.SVGAttributes<SVGElement>> | undefined;
  label: string;
  tooltipContent?: React.ReactNode | undefined;
}

export const FilterItemProperty = observer((props: IFilterItemPropertyProps) => {
  const { icon: Icon, label, tooltipContent } = props;

  return (
    <Tooltip tooltipContent={tooltipContent} position="bottom-start" disabled={!tooltipContent}>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 text-xs text-custom-text-300 min-w-0",
          COMMON_FILTER_ITEM_BORDER_CLASSNAME
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
});

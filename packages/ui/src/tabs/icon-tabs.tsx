import React from "react";
// tooltip
import { Tooltip } from "../tooltip";
// helpers
import { cn } from "../../helpers";

export type TIconTabsProps = {
  buttonClassName?: string;
  containerClassName?: string;
  hideTooltip?: boolean;
  iconClassName?: string;
  iconsList: {
    key: string;
    title: string;
    icon: any;
  }[];
  onSelect: (key: string) => void;
  overlayClassName?: string;
  selectedKey: string | undefined;
};

export const IconTabs: React.FC<TIconTabsProps> = (props) => {
  const {
    buttonClassName,
    containerClassName,
    hideTooltip = false,
    iconClassName,
    iconsList,
    onSelect,
    overlayClassName,
    selectedKey,
  } = props;

  const selectedTabIndex = iconsList.findIndex((icon) => icon.key === selectedKey);

  return (
    <div className={cn("relative flex items-center rounded-[5px] bg-custom-background-80 p-[2px]", containerClassName)}>
      <div
        className={cn(
          "absolute z-0 bg-custom-background-100 top-1/2 rounded-[3px] transition-all duration-500 ease-in-out",
          {
            // right shadow
            "shadow-[2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== iconsList.length - 1,
            // left shadow
            "shadow-[-2px_0_8px_rgba(167,169,174,0.15)]": selectedTabIndex !== 0,
          },
          overlayClassName
        )}
        style={{
          height: "calc(100% - 4px)",
          width: `calc((100% - 4px)/${iconsList.length})`,
          transform: `translate(${selectedTabIndex * 100}%, -50%)`,
        }}
      />
      {iconsList.map((icon) => (
        <Tooltip key={icon.key} tooltipContent={icon.title} disabled={hideTooltip}>
          <button
            type="button"
            className={cn(
              "relative grid h-[22px] w-7 place-items-center overflow-hidden rounded-[3px] transition-all z-[1] text-custom-text-200",
              {
                "text-custom-text-100": selectedKey == icon.key,
              },
              buttonClassName
            )}
            onClick={() => onSelect(icon.key)}
          >
            <icon.icon
              size={14}
              strokeWidth={2}
              className={cn(
                "h-3.5 w-3.5 text-custom-text-200",
                {
                  "text-custom-text-100": selectedKey == icon.key,
                },
                iconClassName
              )}
            />
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

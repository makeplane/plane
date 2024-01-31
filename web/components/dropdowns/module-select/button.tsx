import { FC } from "react";
import { twMerge } from "tailwind-merge";
import { observer } from "mobx-react-lite";
import { ChevronDown, X } from "lucide-react";
// hooks
import { useModule } from "hooks/store";
// ui and components
import { DiceIcon, Tooltip } from "@plane/ui";
// types
import { TModuleSelectButton } from "./types";

export const ModuleSelectButton: FC<TModuleSelectButton> = observer((props) => {
  const {
    value,
    onChange,
    placeholder,
    buttonClassName,
    buttonVariant,
    hideIcon,
    hideText,
    dropdownArrow,
    dropdownArrowClassName,
    showTooltip,
    showCount,
  } = props;
  // hooks
  const { getModuleById } = useModule();

  return (
    <div
      className={twMerge(
        `w-full h-full relative overflow-hidden flex justify-between items-center gap-1 rounded text-sm px-2`,
        buttonVariant === "border-with-text"
          ? `border-[0.5px] border-custom-border-300 hover:bg-custom-background-80`
          : ``,
        buttonVariant === "border-without-text"
          ? `border-[0.5px] border-custom-border-300 hover:bg-custom-background-80`
          : ``,
        buttonVariant === "background-with-text" ? `bg-custom-background-80` : ``,
        buttonVariant === "background-without-text" ? `bg-custom-background-80` : ``,
        buttonVariant === "transparent-with-text" ? `hover:bg-custom-background-80` : ``,
        buttonVariant === "transparent-without-text" ? `hover:bg-custom-background-80` : ``,
        buttonClassName
      )}
    >
      <div className="relative overflow-hidden h-full flex flex-wrap items-center gap-1">
        {value && typeof value === "string" ? (
          <div className="relative overflow-hidden flex items-center gap-1.5">
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            {!hideText && (
              <span className="w-full overflow-hidden truncate inline-block line-clamp-1 capitalize">
                {getModuleById(value)?.name || placeholder}
              </span>
            )}
          </div>
        ) : value && Array.isArray(value) && value.length > 0 ? (
          showCount ? (
            <div className="relative overflow-hidden flex items-center gap-1.5">
              {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
              {!hideText && (
                <span className="w-full overflow-hidden truncate inline-block line-clamp-1 capitalize">
                  {value.length} Modules
                </span>
              )}
            </div>
          ) : (
            value.map((moduleId) => {
              const _module = getModuleById(moduleId);
              if (!_module) return <></>;
              return (
                <div className="relative flex justify-between items-center gap-1 min-w-[60px] max-w-[84px] overflow-hidden bg-custom-background-80 px-1.5 py-1 rounded">
                  <Tooltip tooltipContent={_module?.name} disabled={!showTooltip}>
                    <div className="relative overflow-hidden flex items-center gap-1.5">
                      {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
                      {!hideText && (
                        <span className="w-full truncate inline-block line-clamp-1 capitalize">{_module?.name}</span>
                      )}
                    </div>
                  </Tooltip>
                  <Tooltip tooltipContent="Remove" disabled={!showTooltip}>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(_module.id);
                      }}
                    >
                      <X className="h-2.5 w-2.5 text-custom-text-300 hover:text-red-500" />
                    </span>
                  </Tooltip>
                </div>
              );
            })
          )
        ) : (
          !hideText && (
            <div className="relative overflow-hidden flex items-center gap-1.5">
              {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
              {!hideText && (
                <span className="w-full overflow-hidden truncate inline-block line-clamp-1 capitalize">
                  {placeholder}
                </span>
              )}
            </div>
          )
        )}
      </div>

      {dropdownArrow && (
        <ChevronDown className={twMerge("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
      )}
    </div>
  );
});

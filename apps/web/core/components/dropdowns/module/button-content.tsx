"use client";

import { ChevronDown, X } from "lucide-react";
// plane imports
import { DiceIcon, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useModule } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type ModuleButtonContentProps = {
  disabled: boolean;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon: boolean;
  hideText: boolean;
  onChange: (moduleIds: string[]) => void;
  placeholder?: string;
  showCount: boolean;
  showTooltip?: boolean;
  value: string | string[] | null;
  className?: string;
};

export const ModuleButtonContent: React.FC<ModuleButtonContentProps> = (props) => {
  const {
    disabled,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon,
    hideText,
    onChange,
    placeholder,
    showCount,
    showTooltip = false,
    value,
    className,
  } = props;
  // store hooks
  const { getModuleById } = useModule();
  const { isMobile } = usePlatformOS();

  if (Array.isArray(value))
    return (
      <>
        {showCount ? (
          <div className="relative flex items-center max-w-full gap-1">
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            {(value.length > 0 || !!placeholder) && (
              <div className="max-w-40 flex-grow truncate">
                {value.length > 0
                  ? value.length === 1
                    ? `${getModuleById(value[0])?.name || "module"}`
                    : `${value.length} Module${value.length === 1 ? "" : "s"}`
                  : placeholder}
              </div>
            )}
          </div>
        ) : value.length > 0 ? (
          <div className="flex max-w-full flex-grow flex-wrap items-center gap-2 truncate py-0.5 ">
            {value.map((moduleId) => {
              const moduleDetails = getModuleById(moduleId);
              return (
                <div
                  key={moduleId}
                  className={cn(
                    "flex max-w-full items-center gap-1 rounded bg-custom-background-80 py-1 text-custom-text-200",
                    className
                  )}
                >
                  {!hideIcon && <DiceIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                  {!hideText && (
                    <Tooltip
                      tooltipHeading="Title"
                      tooltipContent={moduleDetails?.name}
                      disabled={!showTooltip}
                      isMobile={isMobile}
                      renderByDefault={false}
                    >
                      <span className="max-w-40 flex-grow truncate text-xs font-medium">{moduleDetails?.name}</span>
                    </Tooltip>
                  )}
                  {!disabled && (
                    <Tooltip
                      tooltipContent="Remove"
                      disabled={!showTooltip}
                      isMobile={isMobile}
                      renderByDefault={false}
                    >
                      <button
                        type="button"
                        className="flex-shrink-0"
                        onClick={() => {
                          const newModuleIds = value.filter((m) => m !== moduleId);
                          onChange(newModuleIds);
                        }}
                      >
                        <X className="h-2.5 w-2.5 text-custom-text-300 hover:text-red-500" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
            <span className="flex-grow truncate text-left">{placeholder}</span>
          </>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
  else
    return (
      <>
        {!hideIcon && <DiceIcon className="h-3 w-3 flex-shrink-0" />}
        {!hideText && (
          <span className="flex-grow truncate text-left">{value ? getModuleById(value)?.name : placeholder}</span>
        )}
        {dropdownArrow && (
          <ChevronDown className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
};

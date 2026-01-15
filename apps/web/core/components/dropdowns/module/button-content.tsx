// plane imports
import { CloseIcon, ModuleIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useModule } from "@/hooks/store/use-module";
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

export function ModuleButtonContent(props: ModuleButtonContentProps) {
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
            {!hideIcon && <ModuleIcon className="h-3 w-3 flex-shrink-0" />}
            {(value.length > 0 || !!placeholder) && (
              <div className="max-w-40 truncate">
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
                    "flex max-w-full items-center gap-1 rounded-sm bg-layer-1 py-1 text-secondary",
                    className
                  )}
                >
                  {!hideIcon && <ModuleIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                  {!hideText && (
                    <Tooltip
                      tooltipHeading="Title"
                      tooltipContent={moduleDetails?.name}
                      disabled={!showTooltip}
                      isMobile={isMobile}
                      renderByDefault={false}
                    >
                      <span className="max-w-40 truncate text-11 font-medium">{moduleDetails?.name}</span>
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
                        <CloseIcon className="h-2.5 w-2.5 text-tertiary hover:text-danger-primary" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {!hideIcon && <ModuleIcon className="h-3 w-3 flex-shrink-0" />}
            <span className="flex-grow truncate text-left">{placeholder}</span>
          </>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
  else
    return (
      <>
        {!hideIcon && <ModuleIcon className="h-3 w-3 flex-shrink-0" />}
        {!hideText && (
          <span className="flex-grow truncate text-left">{value ? getModuleById(value)?.name : placeholder}</span>
        )}
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 flex-shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
}

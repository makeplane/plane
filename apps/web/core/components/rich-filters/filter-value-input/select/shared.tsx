// plane imports
import type { TSupportedFilterFieldConfigs, IFilterOption, TFilterValue } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../../shared";

type TLoadOptionsProps<V extends TFilterValue> = {
  config: TSupportedFilterFieldConfigs<V>;
  setOptions: (options: IFilterOption<V>[]) => void;
  setLoading?: (loading: boolean) => void;
};

export const loadOptions = async <V extends TFilterValue>(props: TLoadOptionsProps<V>) => {
  const { config, setOptions, setLoading } = props;

  // if the config has a getOptions function, load the options
  if ("getOptions" in config && typeof config.getOptions === "function") {
    setLoading?.(true);
    try {
      const result = await config.getOptions();
      setOptions(result);
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setLoading?.(false);
    }
  }
};

export const getFormattedOptions = <V extends TFilterValue>(options: IFilterOption<V>[]) =>
  options.map((option) => ({
    value: option.value,
    content: (
      <div className="flex items-center gap-2 transition-all duration-200 ease-in-out">
        {option.icon && (
          <span className={cn("transition-transform duration-200", option.iconClassName)}>{option.icon}</span>
        )}
        <span>{option.label}</span>
      </div>
    ),
    query: option.label.toString().toLowerCase(),
    disabled: option.disabled,
    tooltip: option.description,
  }));

export const getCommonCustomSearchSelectProps = (isDisabled?: boolean) => ({
  customButtonClassName: cn(
    "h-full w-full px-2 text-13 font-regular transition-all duration-300 ease-in-out",
    !isDisabled && COMMON_FILTER_ITEM_BORDER_CLASSNAME,
    isDisabled && "hover:bg-surface-1"
  ),
  optionsClassName: "w-56",
  maxHeight: "md" as const,
});

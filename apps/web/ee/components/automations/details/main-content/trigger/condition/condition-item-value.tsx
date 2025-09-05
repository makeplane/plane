import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
// plane imports
import {
  FILTER_TYPE,
  TAutomationConditionFilterProperty,
  TFilterValue,
  type TFilterConditionNode,
  type TFilterConfig,
  type TFilterOption,
} from "@plane/types";

interface FilterValueInputProps<V extends TFilterValue> {
  config: TFilterConfig<TAutomationConditionFilterProperty, V>;
  filter: TFilterConditionNode<TAutomationConditionFilterProperty, V>;
}

export const AutomationDetailsMainContentTriggerConditionItemValue: React.FC<FilterValueInputProps<TFilterValue>> =
  observer((props) => {
    const { config, filter } = props;
    // states
    const [options, setOptions] = useState<TFilterOption<TFilterValue>[]>([]);

    useEffect(() => {
      const loadOptions = async () => {
        if ("getOptions" in config && typeof config.getOptions === "function") {
          try {
            const result = await config.getOptions();
            setOptions(result);
          } catch (error) {
            console.error("Failed to load options:", error);
          }
        }
      };

      loadOptions();
    }, [config]);

    const getDisplayContent = (): React.ReactNode => {
      if (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)) {
        return "--";
      }

      const selectedOptions = (Array.isArray(filter.value) ? filter.value : [filter.value])
        .map((value) => options.find((opt) => opt.value === value))
        .filter(Boolean) as TFilterOption<TFilterValue>[];

      if (selectedOptions.length === 0) {
        // Handle special types when no matching option is found
        if (Array.isArray(filter.value) && filter.value.length === 1) {
          const value = filter.value[0];
          if (value instanceof Date || (typeof value === "string" && config.type === FILTER_TYPE.DATE)) {
            try {
              return new Date(value).toLocaleDateString();
            } catch {
              return String(value);
            }
          }
        }
        return `${Array.isArray(filter.value) ? filter.value.length : 1} selected`;
      }

      // Display first 2 items with icons
      const displayCount = 4;
      const remainingCount = selectedOptions.length - displayCount;
      return (
        <>
          {selectedOptions.slice(0, displayCount).map((option, index) => (
            <div key={option.id} className="flex items-center whitespace-nowrap font-medium">
              <span>{option.label}</span>
              {index < Math.min(displayCount, selectedOptions.length) - 1 && (
                <span className="text-custom-text-300">,</span>
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <Transition
              show
              appear
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              className="text-custom-text-300 whitespace-nowrap"
            >
              +{remainingCount} more
            </Transition>
          )}
        </>
      );
    };

    return <>{getDisplayContent()}</>;
  });

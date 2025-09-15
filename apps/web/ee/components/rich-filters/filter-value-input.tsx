import React, { useState, useEffect, ReactNode } from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
// plane imports
import {
  FILTER_TYPE,
  TFilterConfig,
  TFilterConditionNode,
  TFilterOption,
  TFilterProperty,
  TFilterValue,
  SingleOrArray,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";

interface FilterValueInputProps<P extends TFilterProperty, V extends TFilterValue> {
  config: TFilterConfig<P, V>;
  filter: TFilterConditionNode<P, V>;
  onChange: (values: SingleOrArray<V>) => void;
}

const EMPTY_VALUE = "--";

export const FilterValueInput = observer(
  <P extends TFilterProperty, V extends TFilterValue>(props: FilterValueInputProps<P, V>) => {
    const { config, filter, onChange } = props;
    // states
    const [options, setOptions] = useState<TFilterOption<V>[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
      const loadOptions = async () => {
        if ("getOptions" in config && typeof config.getOptions === "function") {
          setLoading(true);
          try {
            const result = await config.getOptions();
            setOptions(result);
          } catch (error) {
            console.error("Failed to load options:", error);
          } finally {
            setLoading(false);
          }
        }
      };

      loadOptions();
    }, [config]);

    // Transform options to CustomSearchSelect format
    const formattedOptions = options.map((option) => ({
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

    const handleSelectChange = (selected: SingleOrArray<V>) => {
      onChange(selected ?? ([] as unknown as SingleOrArray<V>));
    };

    const getDisplayContent = (): ReactNode => {
      if (
        filter.value === null ||
        filter.value === undefined ||
        (Array.isArray(filter.value) && filter.value.length === 0)
      ) {
        return EMPTY_VALUE;
      }

      const filterValues = filter.value;
      const values = (Array.isArray(filterValues) ? filterValues : [filterValues]) as V[];
      const selectedOptions = values
        .map((value) => options.find((opt) => opt.value === value))
        .filter(Boolean) as TFilterOption<V>[];

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
      const displayCount = 2;
      const remainingCount = selectedOptions.length - displayCount;
      return (
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOptions.slice(0, displayCount).map((option, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center whitespace-nowrap">
                {option.icon && <span className={cn("mr-1", option.iconClassName)}>{option.icon}</span>}
                <span className="truncate max-w-24">{option.label}</span>
                {index < Math.min(displayCount, selectedOptions.length) - 1 && (
                  <span className="text-custom-text-300">,</span>
                )}
              </div>
            </React.Fragment>
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
        </div>
      );
    };

    switch (config.type) {
      case FILTER_TYPE.SELECT:
        return (
          <CustomSearchSelect
            value={filter.value}
            onChange={handleSelectChange}
            options={formattedOptions}
            customButtonClassName={cn("h-full w-full px-2 text-sm font-normal transition-all duration-300 ease-in-out")}
            optionsClassName="w-56"
            maxHeight="md"
            multiple={false}
            disabled={loading}
            customButton={
              <div className="flex items-center h-full overflow-hidden transition-all duration-200">
                {getDisplayContent()}
              </div>
            }
            defaultOpen={
              filter.value === null ||
              filter.value === undefined ||
              (Array.isArray(filter.value) && filter.value.length === 0)
            }
          />
        );
      case FILTER_TYPE.MULTI_SELECT:
        return (
          <CustomSearchSelect
            value={Array.isArray(filter.value) ? filter.value : filter.value ? [filter.value] : []}
            onChange={handleSelectChange}
            options={formattedOptions}
            multiple
            customButtonClassName={cn("h-full w-full px-2 text-sm font-normal transition-all duration-300 ease-in-out")}
            optionsClassName="w-56"
            maxHeight="md"
            disabled={loading}
            customButton={
              <div className="flex items-center h-full overflow-hidden transition-all duration-200">
                {getDisplayContent()}
              </div>
            }
            defaultOpen={!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)}
          />
        );

      // TODO: Add date picker
      case FILTER_TYPE.DATE:
        return null;

      default:
        return (
          <div className="h-full flex items-center px-4 text-sm text-custom-text-400 transition-opacity duration-200">
            Filter type not supported
          </div>
        );
    }
  }
);

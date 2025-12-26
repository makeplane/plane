import { Combobox } from "@headlessui/react";

import React from "react";
import { CheckIcon } from "@plane/propel/icons";
// helpers
import { cn } from "../../utils";
// types
import type { IMultiSelectDropdownOptions, ISingleSelectDropdownOptions } from "../dropdown";
// components
import { DropdownOptionsLoader, InputSearch } from ".";

export function DropdownOptions(props: IMultiSelectDropdownOptions | ISingleSelectDropdownOptions) {
  const {
    isOpen,
    query,
    setQuery,
    inputIcon,
    inputPlaceholder,
    inputClassName,
    inputContainerClassName,
    disableSearch,
    keyExtractor,
    options,
    handleClose,
    value,
    renderItem,
    loader,
    isMobile = false,
  } = props;
  return (
    <>
      {!disableSearch && (
        <InputSearch
          isOpen={isOpen}
          query={query}
          updateQuery={(query) => setQuery(query)}
          inputIcon={inputIcon}
          inputPlaceholder={inputPlaceholder}
          inputClassName={inputClassName}
          inputContainerClassName={inputContainerClassName}
          isMobile={isMobile}
        />
      )}
      <div className={cn("max-h-48 space-y-1 overflow-y-scroll", !disableSearch && "mt-2")}>
        <>
          {options ? (
            options.length > 0 ? (
              options?.map((option) => (
                <Combobox.Option
                  key={keyExtractor(option)}
                  value={keyExtractor(option)}
                  disabled={option.disabled}
                  className={({ active, selected }) =>
                    cn(
                      "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5",
                      {
                        "bg-layer-1": active,
                        "text-primary": selected,
                        "text-secondary": !selected,
                      },
                      option.className && option.className({ active, selected })
                    )
                  }
                  onClick={handleClose}
                >
                  {({ selected }) => (
                    <>
                      {renderItem ? (
                        <>{renderItem({ value: keyExtractor(option), selected, disabled: option.disabled })}</>
                      ) : (
                        <>
                          <span className="flex-grow truncate">{option.value}</span>
                          {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                        </>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))
            ) : (
              <p className="px-1.5 py-1 italic text-placeholder">No matching results</p>
            )
          ) : loader ? (
            <> {loader} </>
          ) : (
            <DropdownOptionsLoader />
          )}
        </>
      </div>
    </>
  );
}

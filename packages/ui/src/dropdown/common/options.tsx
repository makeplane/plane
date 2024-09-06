import React from "react";
// headless ui
import { Combobox } from "@headlessui/react";
// icons
import { Check } from "lucide-react";
// components
import { DropdownOptionsLoader, InputSearch } from ".";
// helpers
import { cn } from "../../../helpers";
// types
import { IMultiSelectDropdownOptions, ISingleSelectDropdownOptions } from "../dropdown";

export const DropdownOptions: React.FC<IMultiSelectDropdownOptions | ISingleSelectDropdownOptions> = (props) => {
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
      <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
        <>
          {options ? (
            options.length > 0 ? (
              options?.map((option) => (
                <Combobox.Option
                  key={keyExtractor(option)}
                  value={keyExtractor(option)}
                  className={({ active, selected }) =>
                    cn(
                      "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                      {
                        "bg-custom-background-80": active,
                        "text-custom-text-100": selected,
                        "text-custom-text-200": !selected,
                      },
                      option.className && option.className({ active, selected })
                    )
                  }
                  onClick={handleClose}
                >
                  {({ selected }) => (
                    <>
                      {renderItem ? (
                        <>{renderItem({ value: keyExtractor(option), selected })}</>
                      ) : (
                        <>
                          <span className="flex-grow truncate">{option.value}</span>
                          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        </>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))
            ) : (
              <p className="px-1.5 py-1 italic text-custom-text-400">No matching results</p>
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
};

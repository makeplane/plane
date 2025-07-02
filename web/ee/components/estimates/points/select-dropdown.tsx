"use client";

import { FC, Fragment, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { Check, ChevronDown, Info } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { EEstimateSystem, TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { Tooltip } from "@plane/ui";
// helpers
import { cn, convertMinutesToHoursMinutesString } from "@plane/utils";

type TEstimatePointDropdown = {
  options: TEstimatePointsObject[];
  error: string | undefined;
  callback: (estimateId: string) => void;
  estimateSystem: TEstimateSystemKeys;
};

export const EstimatePointDropdown: FC<TEstimatePointDropdown> = (props) => {
  const { options, error, callback, estimateSystem } = props;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // ref
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(dropdownContainerRef, () => setIsDropdownOpen(false));

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  // derived values
  const selectedValue = selectedOption
    ? selectedOption === "none"
      ? {
          id: undefined,
          key: undefined,
          value: "None",
        }
      : options.find((option) => option?.id === selectedOption)
    : undefined;

  return (
    <div ref={dropdownContainerRef} className="w-full relative">
      <Listbox
        as="div"
        ref={dropdownRef}
        value={selectedOption}
        onChange={(selectedOption) => {
          setSelectedOption(selectedOption);
          callback(selectedOption);
          setIsDropdownOpen(false);
        }}
        className="w-full flex-shrink-0 text-left"
      >
        <Listbox.Button
          type="button"
          ref={setReferenceElement}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={cn(
            "relative w-full rounded border flex items-center gap-3 px-3 py-2",
            error ? `border-red-500` : `border-custom-border-200`
          )}
        >
          <div
            className={cn(`w-full text-sm text-left`, !selectedValue ? "text-custom-text-300" : "text-custom-text-100")}
          >
            {estimateSystem === EEstimateSystem.TIME && selectedValue?.id
              ? convertMinutesToHoursMinutesString(Number(selectedValue?.value))
              : selectedValue?.value || "Select an estimate point"}
          </div>
          <ChevronDown className={`size-3 ${true ? "stroke-onboarding-text-400" : "stroke-onboarding-text-100"}`} />
          {error && (
            <>
              <Tooltip tooltipContent={error} position="bottom">
                <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden relative flex justify-center items-center text-red-500">
                  <Info size={14} />
                </div>
              </Tooltip>
            </>
          )}
        </Listbox.Button>

        <Transition
          show={isDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className="p-1.5 fixed z-10 mt-1 h-fit w-48 sm:w-60 overflow-y-auto rounded-md border border-custom-border-200 bg-custom-background-100 shadow-sm focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <Listbox.Options>
              <div>
                <Listbox.Option
                  value={"none"}
                  className={cn(
                    `cursor-pointer select-none truncate rounded px-1 py-1.5 hover:bg-custom-background-90`,
                    selectedOption === "none" ? "text-custom-text-100" : "text-custom-text-300"
                  )}
                >
                  <div className="relative flex items-center text-wrap gap-2 px-1 py-0.5">
                    <div className="text-sm font-medium w-full line-clamp-1">None</div>
                    {selectedOption === "none" && <Check size={12} />}
                  </div>
                </Listbox.Option>
                {options.map((option) => (
                  <Listbox.Option
                    key={option?.key}
                    value={option?.id}
                    className={cn(
                      `cursor-pointer select-none truncate rounded px-1 py-1.5 hover:bg-custom-background-90`,
                      selectedOption === option?.id ? "text-custom-text-100" : "text-custom-text-300"
                    )}
                  >
                    <div className="relative flex items-center text-wrap gap-2 px-1 py-0.5">
                      <div className="text-sm font-medium w-full line-clamp-1">
                        {estimateSystem === EEstimateSystem.TIME
                          ? convertMinutesToHoursMinutesString(Number(option.value))
                          : option.value}
                      </div>
                      {selectedOption === option?.id && <Check size={12} />}
                    </div>
                  </Listbox.Option>
                ))}
              </div>
            </Listbox.Options>
          </div>
        </Transition>
      </Listbox>
    </div>
  );
};

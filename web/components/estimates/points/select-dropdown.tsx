import { FC, useRef, Fragment, useState } from "react";
import { Info, Check, ChevronDown } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { TEstimatePointsObject } from "@plane/types";
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import useDynamicDropdownPosition from "@/hooks/use-dynamic-dropdown";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

type TEstimatePointDropdown = {
  options: TEstimatePointsObject[];
  error: string | undefined;
  callback: (estimateId: string) => void;
};

export const EstimatePointDropdown: FC<TEstimatePointDropdown> = (props) => {
  const { options, error, callback } = props;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  // ref
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useDynamicDropdownPosition(isDropdownOpen, () => setIsDropdownOpen(false), buttonRef, dropdownRef);
  useOutsideClickDetector(dropdownContainerRef, () => setIsDropdownOpen(false));

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
          ref={buttonRef}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={cn(
            "relative w-full rounded border flex items-center gap-3 p-2.5",
            error ? `border-red-500` : `border-custom-border-200`
          )}
        >
          <div
            className={cn(`w-full text-sm text-left`, !selectedValue ? "text-custom-text-300" : "text-custom-text-100")}
          >
            {selectedValue?.value || "Select an estimate point"}
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
          <Listbox.Options
            ref={dropdownRef}
            className="fixed z-10 mt-1 h-fit w-48 sm:w-60 overflow-y-auto rounded-md border border-custom-border-200 bg-custom-background-100 shadow-sm focus:outline-none"
          >
            <div className="p-1.5">
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
                    <div className="text-sm font-medium w-full line-clamp-1">{option.value}</div>
                    {selectedOption === option?.id && <Check size={12} />}
                  </div>
                </Listbox.Option>
              ))}
            </div>
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );
};

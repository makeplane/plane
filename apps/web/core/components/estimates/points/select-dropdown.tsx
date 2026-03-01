/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Fragment, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { CheckIcon, InfoIcon, ChevronDownIcon } from "@plane/propel/icons";
import { Listbox, Transition } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { Tooltip } from "@plane/propel/tooltip";
import type { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
// helpers
import { cn, convertMinutesToHoursMinutesString } from "@plane/utils";

type TEstimatePointDropdown = {
  options: TEstimatePointsObject[];
  error: string | undefined;
  callback: (estimateId: string) => void;
  estimateSystem: TEstimateSystemKeys;
};

export function EstimatePointDropdown(props: TEstimatePointDropdown) {
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
            "relative w-full rounded-sm border flex items-center gap-3 px-3 py-2",
            error ? `border-danger-strong` : `border-subtle-1`
          )}
        >
          <div className={cn(`w-full text-13 text-left`, !selectedValue ? "text-tertiary" : "text-primary")}>
            {estimateSystem === EEstimateSystem.TIME && selectedValue?.id
              ? convertMinutesToHoursMinutesString(Number(selectedValue?.value))
              : selectedValue?.value || "Select an estimate point"}
          </div>
          <ChevronDownIcon className="size-3 stroke-onboarding-text-400" />
          {error && (
            <>
              <Tooltip tooltipContent={error} position="bottom">
                <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden relative flex justify-center items-center text-danger-primary">
                  <InfoIcon height={14} width={14} />
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
            className="p-1.5 fixed z-10 mt-1 h-fit w-48 sm:w-60 overflow-y-auto rounded-md border border-subtle-1 bg-surface-1 shadow-sm focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <Listbox.Options>
              <div>
                <Listbox.Option
                  value={"none"}
                  className={cn(
                    `cursor-pointer select-none truncate rounded-sm px-1 py-1.5 hover:bg-layer-1`,
                    selectedOption === "none" ? "text-primary" : "text-tertiary"
                  )}
                >
                  <div className="relative flex items-center text-wrap gap-2 px-1 py-0.5">
                    <div className="text-13 font-medium w-full line-clamp-1">None</div>
                    {selectedOption === "none" && <CheckIcon height={12} width={12} />}
                  </div>
                </Listbox.Option>
                {options.map((option) => (
                  <Listbox.Option
                    key={option?.key}
                    value={option?.id}
                    className={cn(
                      `cursor-pointer select-none truncate rounded-sm px-1 py-1.5 hover:bg-layer-1`,
                      selectedOption === option?.id ? "text-primary" : "text-tertiary"
                    )}
                  >
                    <div className="relative flex items-center text-wrap gap-2 px-1 py-0.5">
                      <div className="text-13 font-medium w-full line-clamp-1">
                        {estimateSystem === EEstimateSystem.TIME
                          ? convertMinutesToHoursMinutesString(Number(option.value))
                          : option.value}
                      </div>
                      {selectedOption === option?.id && <CheckIcon width={12} height={12} />}
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
}

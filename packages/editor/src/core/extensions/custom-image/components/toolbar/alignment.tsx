/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// local imports
import type { TCustomImageAlignment } from "../../types";
import { IMAGE_ALIGNMENT_OPTIONS } from "../../utils";

type Props = {
  activeAlignment: TCustomImageAlignment;
  handleChange: (alignment: TCustomImageAlignment) => void;
  isTouchDevice: boolean;
  toggleToolbarViewStatus: (val: boolean) => void;
};

export function ImageAlignmentAction(props: Props) {
  const { activeAlignment, handleChange, isTouchDevice, toggleToolbarViewStatus } = props;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  // derived values
  const activeAlignmentDetails = IMAGE_ALIGNMENT_OPTIONS.find((option) => option.value === activeAlignment);

  useOutsideClickDetector(dropdownRef, () => setIsDropdownOpen(false));

  useEffect(() => {
    toggleToolbarViewStatus(isDropdownOpen);
  }, [isDropdownOpen, toggleToolbarViewStatus]);

  return (
    <div ref={dropdownRef} className="relative h-full">
      <Tooltip disabled={isTouchDevice} tooltipContent="Align">
        <button
          type="button"
          className="flex h-full items-center gap-1 text-white/60 transition-colors hover:text-white"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {activeAlignmentDetails && <activeAlignmentDetails.icon className="size-3 flex-shrink-0" />}
          <ChevronDownIcon className="size-2 flex-shrink-0" />
        </button>
      </Tooltip>
      {isDropdownOpen && (
        <div className="absolute top-full left-1/2 mt-0.5 flex h-7 -translate-x-1/2 items-center gap-2 rounded-sm bg-black/80 px-2">
          {IMAGE_ALIGNMENT_OPTIONS.map((option) => (
            <Tooltip disabled={isTouchDevice} key={option.value} tooltipContent={option.label}>
              <button
                type="button"
                className="grid h-full flex-shrink-0 place-items-center text-white/60 transition-colors hover:text-white"
                onClick={() => {
                  handleChange(option.value);
                  setIsDropdownOpen(false);
                }}
              >
                <option.icon className="size-3" />
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

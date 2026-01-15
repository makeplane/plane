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
    <div ref={dropdownRef} className="h-full relative">
      <Tooltip disabled={isTouchDevice} tooltipContent="Align">
        <button
          type="button"
          className="h-full flex items-center gap-1 text-white/60 hover:text-white transition-colors"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {activeAlignmentDetails && <activeAlignmentDetails.icon className="flex-shrink-0 size-3" />}
          <ChevronDownIcon className="flex-shrink-0 size-2" />
        </button>
      </Tooltip>
      {isDropdownOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 h-7 bg-black/80 flex items-center gap-2 px-2 rounded-sm">
          {IMAGE_ALIGNMENT_OPTIONS.map((option) => (
            <Tooltip disabled={isTouchDevice} key={option.value} tooltipContent={option.label}>
              <button
                type="button"
                className="flex-shrink-0 h-full grid place-items-center text-white/60 hover:text-white transition-colors"
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

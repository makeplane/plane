import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// plane imports
import { Tooltip } from "@plane/ui";
// hooks
import { useOutsideClickDetector } from "@/hooks/use-outside-click-detector";
// local imports
import type { TCustomImageAlignment } from "../../types";
import { IMAGE_ALIGNMENT_OPTIONS } from "../../utils";

type Props = {
  activeAlignment: TCustomImageAlignment;
  handleChange: (alignment: TCustomImageAlignment) => void;
  toggleToolbarViewStatus: (val: boolean) => void;
};

export const ImageAlignmentAction: React.FC<Props> = (props) => {
  const { activeAlignment, handleChange, toggleToolbarViewStatus } = props;
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
      <Tooltip tooltipContent="Align">
        <button
          type="button"
          className="h-full flex items-center gap-1 text-white/60 hover:text-white transition-colors"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {activeAlignmentDetails && <activeAlignmentDetails.icon className="flex-shrink-0 size-3" />}
          <ChevronDown className="flex-shrink-0 size-2" />
        </button>
      </Tooltip>
      {isDropdownOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 h-7 bg-black/80 flex items-center gap-2 px-2 rounded">
          {IMAGE_ALIGNMENT_OPTIONS.map((option) => (
            <Tooltip key={option.value} tooltipContent={option.label}>
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
};

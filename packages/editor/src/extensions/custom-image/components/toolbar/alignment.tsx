/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useId, useRef, useState } from "react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { Toolbar, ToolbarButton, ToolbarMenuTriggerButton } from "@makeplane/propel/elements/toolbar";
import { useOutsideClickDetector } from "@plane/hooks";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
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
  const dropdownId = useId();
  // derived values
  const activeAlignmentDetails = IMAGE_ALIGNMENT_OPTIONS.find((option) => option.value === activeAlignment);

  useOutsideClickDetector(dropdownRef, () => setIsDropdownOpen(false));

  useEffect(() => {
    toggleToolbarViewStatus(isDropdownOpen);
  }, [isDropdownOpen, toggleToolbarViewStatus]);

  return (
    <div ref={dropdownRef} className="relative h-full">
      <Tooltip disabled={isTouchDevice} label="Align">
        <ToolbarMenuTriggerButton
          type="button"
          size="sm"
          aria-label="Align image"
          aria-expanded={isDropdownOpen}
          aria-controls={isDropdownOpen ? dropdownId : undefined}
          data-popup-open={isDropdownOpen ? "" : undefined}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {activeAlignmentDetails && <Icon icon={activeAlignmentDetails.icon} />}
          <Icon icon={ChevronDownOutline} tint="secondary" />
        </ToolbarMenuTriggerButton>
      </Tooltip>
      {isDropdownOpen && (
        <div className="absolute top-full left-1/2 mt-2.5 -translate-x-1/2">
          <Toolbar id={dropdownId} size="sm" elevation="raised" role="group" aria-label="Image alignment">
            {IMAGE_ALIGNMENT_OPTIONS.map((option) => (
              <Tooltip disabled={isTouchDevice} key={option.value} label={option.label}>
                <ToolbarButton
                  type="button"
                  size="sm"
                  labeled={false}
                  aria-label={`Align image ${option.value}`}
                  aria-pressed={option.value === activeAlignment}
                  data-pressed={option.value === activeAlignment ? "" : undefined}
                  onClick={() => {
                    handleChange(option.value);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Icon icon={option.icon} />
                </ToolbarButton>
              </Tooltip>
            ))}
          </Toolbar>
        </div>
      )}
    </div>
  );
}

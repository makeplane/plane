/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronDownOutline, DeactivatedOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { Button } from "@makeplane/propel/elements/button";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { PopoverPopup } from "@makeplane/propel/elements/popover";
// plane utils
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";

type Props = {
  disabled: boolean;
  isOpen: boolean;
  onSelect: (color: string | null) => void;
  toggleDropdown: () => void;
};

export function CalloutBlockColorSelector(props: Props) {
  const { disabled, isOpen, onSelect, toggleDropdown } = props;

  const handleColorSelect = (val: string | null) => {
    onSelect(val);
    toggleDropdown();
  };

  return (
    <div
      className={cn("pointer-events-none absolute top-2 right-2 z-10 opacity-0 transition-opacity", {
        "group-hover/callout-node:pointer-events-auto group-hover/callout-node:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100":
          !disabled,
        "pointer-events-auto opacity-100": isOpen,
      })}
      contentEditable={false}
    >
      <div className="relative">
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          stretch="auto"
          aria-expanded={isOpen}
          onClick={(e) => {
            toggleDropdown();
            e.stopPropagation();
          }}
          disabled={disabled}
        >
          <span>Color</span>
          <Icon icon={ChevronDownOutline} />
        </Button>
        {isOpen && (
          <section className="animate-in fade-in slide-in-from-top-1 absolute top-full right-0 z-10 mt-1">
            <PopoverPopup variant="rich">
              <div role="group" aria-label="Background colors" className="flex items-center gap-2">
                {COLORS_LIST.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    aria-label={`${color.label} background color`}
                    className="size-6 shrink-0 cursor-pointer rounded-sm border-xs border-subtle transition-opacity outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-1"
                    style={{
                      backgroundColor: color.backgroundColor,
                    }}
                    onClick={() => handleColorSelect(color.key)}
                  />
                ))}
                <IconButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-label="Clear background color"
                  onClick={() => handleColorSelect(null)}
                >
                  <Icon icon={DeactivatedOutline} />
                </IconButton>
              </div>
            </PopoverPopup>
          </section>
        )}
      </div>
    </div>
  );
}

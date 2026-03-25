/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Ban } from "lucide-react";
import { ChevronDownIcon } from "@plane/propel/icons";
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
        "group-hover/callout-node:pointer-events-auto group-hover/callout-node:opacity-100": !disabled,
        "pointer-events-auto opacity-100": isOpen,
      })}
      contentEditable={false}
    >
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            toggleDropdown();
            e.stopPropagation();
          }}
          className={cn(
            "flex h-full items-center gap-1 rounded-sm px-2.5 py-1 text-13 font-medium whitespace-nowrap text-tertiary transition-colors hover:bg-layer-1-hover active:bg-layer-1-active",
            {
              "bg-layer-1": isOpen,
            }
          )}
          disabled={disabled}
        >
          <span className="text-12">Color</span>
          <ChevronDownIcon className="size-3 flex-shrink-0" />
        </button>
        {isOpen && (
          <section className="animate-in fade-in slide-in-from-top-1 absolute top-full right-0 z-10 mt-1 rounded-md border-[0.5px] border-strong bg-surface-1 p-2 shadow-raised-200">
            <div className="flex items-center gap-2">
              {COLORS_LIST.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  className="size-6 flex-shrink-0 rounded-sm border-[0.5px] border-strong-1 transition-opacity hover:opacity-60"
                  style={{
                    backgroundColor: color.backgroundColor,
                  }}
                  onClick={() => handleColorSelect(color.key)}
                />
              ))}
              <button
                type="button"
                className="grid size-6 flex-shrink-0 place-items-center rounded-sm border-[0.5px] border-strong-1 text-tertiary transition-colors hover:bg-layer-1-hover"
                onClick={() => handleColorSelect(null)}
              >
                <Ban className="size-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

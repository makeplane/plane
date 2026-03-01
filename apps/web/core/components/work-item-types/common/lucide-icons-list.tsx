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

import React, { useState } from "react";
import { Search } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
// plane imports
import { DEFAULT_BACKGROUND_COLORS } from "@plane/constants";
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { ColorPicker, Input } from "@plane/ui";
import { generateIconColors } from "@plane/utils";
import { cn } from "@plane/propel/utils";

export type TIconsListProps = {
  defaultBackgroundColor?: string;
  onChange: (val: TLogoProps["icon"], shouldClose: boolean) => void;
};

export function LucideIconsList(props: TIconsListProps) {
  const { defaultBackgroundColor, onChange } = props;
  // states
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState(defaultBackgroundColor || "#000000");

  const filteredArray = LUCIDE_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

  // Handle color change
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onChange(
      {
        background_color: color,
      },
      false
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3 sticky top-0 p-2.5 bg-surface-1">
        <div
          className={cn("relative flex items-center gap-2 bg-layer-1 h-8 rounded-lg w-full px-[30px] border", {
            "border-accent-strong": isInputFocused,
            "border-transparent": !isInputFocused,
          })}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        >
          <Search className="absolute left-2.5 bottom-2 h-3.5 w-3.5 text-placeholder" />
          <Input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-[1rem] border-none p-0 h-full w-full"
          />
        </div>

        <div>
          <div className="w-full text-13 text-secondary">Choose background color</div>
          <div className="grid grid-cols-10 gap-1 items-center justify-items-center py-1 h-9">
            <div
              className="relative grid place-items-center cursor-pointer rounded-full transition-all duration-200 ease-linear size-6"
              style={{
                backgroundColor: !DEFAULT_BACKGROUND_COLORS.includes(selectedColor)
                  ? generateIconColors(selectedColor).background
                  : "transparent",
              }}
            >
              <ColorPicker
                value={selectedColor}
                onChange={handleColorChange}
                className={`transition-all duration-200 ease-in-out size-4`}
              />
            </div>
            {DEFAULT_BACKGROUND_COLORS.map((curCol) => (
              <button
                key={curCol}
                type="button"
                className={`relative grid place-items-center cursor-pointer rounded-full transition-all duration-200 ease-linear size-6`}
                style={{
                  backgroundColor:
                    curCol === selectedColor ? generateIconColors(selectedColor).background : "transparent",
                }}
                onClick={() => {
                  setSelectedColor(curCol);
                  onChange(
                    {
                      background_color: curCol,
                    },
                    false
                  );
                }}
              >
                <span
                  className={`cursor-pointer rounded-full size-4 transition-all  ease-in-out`}
                  style={{
                    backgroundColor: generateIconColors(curCol).foreground,
                  }}
                >
                  {curCol === selectedColor && (
                    <CheckIcon className="absolute inset-0 m-auto text-on-color size-3" strokeWidth={3} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="w-full text-13 text-secondary">Pick icon</div>
          <div className="grid grid-cols-8 gap-1 justify-items-center mt-2">
            {filteredArray.map((icon) => (
              <button
                key={icon.name}
                type="button"
                className="h-9 w-9 select-none text-lg grid place-items-center rounded-sm hover:bg-layer-1-hover"
                onClick={() => {
                  onChange(
                    {
                      name: icon.name,
                    },
                    true
                  );
                }}
              >
                <icon.element className="size-4 text-tertiary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

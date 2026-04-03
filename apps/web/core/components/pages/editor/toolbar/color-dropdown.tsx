/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { memo } from "react";
import { ALargeSmall, Ban } from "lucide-react";
import { Popover } from "@headlessui/react";
// plane editor
import { COLORS_LIST } from "@plane/editor";
import type { TEditorCommands } from "@plane/editor";
// helpers
import { cn } from "@plane/utils";

type Props = {
  handleColorSelect: (
    key: Extract<TEditorCommands, "text-color" | "background-color">,
    color: string | undefined
  ) => void;
  isColorActive: (
    key: Extract<TEditorCommands, "text-color" | "background-color">,
    color: string | undefined
  ) => boolean;
};

export const ColorDropdown = memo(function ColorDropdown(props: Props) {
  const { handleColorSelect, isColorActive } = props;

  const activeTextColor = COLORS_LIST.find((c) => isColorActive("text-color", c.key));
  const activeBackgroundColor = COLORS_LIST.find((c) => isColorActive("background-color", c.key));

  return (
    <Popover as="div" className="h-7 px-2">
      {({ open }) => (
        <>
          <Popover.Button
            type="button"
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-sm px-2 text-13 outline-none",
              "text-tertiary hover:bg-layer-1",
              {
                "bg-layer-1 text-primary": open,
              }
            )}
          >
            Color
            <span
              className={cn("grid size-6 shrink-0 place-items-center rounded-sm border-[0.5px] border-strong", {
                "bg-surface-1": !activeBackgroundColor,
              })}
              style={{
                backgroundColor: activeBackgroundColor ? activeBackgroundColor.backgroundColor : "transparent",
              }}
            >
              <ALargeSmall
                className={cn("size-3.5", {
                  "text-primary": !activeTextColor,
                })}
                style={{
                  color: activeTextColor ? activeTextColor.textColor : "inherit",
                }}
              />
            </span>
          </Popover.Button>
          <Popover.Panel
            as="div"
            className="fixed z-20 mt-1 space-y-2 rounded-md border-[0.5px] border-strong bg-surface-1 p-2 shadow-raised-200"
          >
            <div className="space-y-1.5">
              <p className="text-11 font-semibold text-tertiary">Text colors</p>
              <div className="flex items-center gap-2">
                {COLORS_LIST.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    className="size-6 flex-shrink-0 rounded-sm border-[0.5px] border-strong-1 transition-opacity hover:opacity-60"
                    style={{
                      backgroundColor: color.textColor,
                    }}
                    onClick={() => handleColorSelect("text-color", color.key)}
                  />
                ))}
                <button
                  type="button"
                  className="grid size-6 flex-shrink-0 place-items-center rounded-sm border-[0.5px] border-strong-1 text-tertiary transition-colors hover:bg-layer-1"
                  onClick={() => handleColorSelect("text-color", undefined)}
                >
                  <Ban className="size-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-11 font-semibold text-tertiary">Background colors</p>
              <div className="flex items-center gap-2">
                {COLORS_LIST.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    className="size-6 flex-shrink-0 rounded-sm border-[0.5px] border-strong-1 transition-opacity hover:opacity-60"
                    style={{
                      backgroundColor: color.backgroundColor,
                    }}
                    onClick={() => handleColorSelect("background-color", color.key)}
                  />
                ))}
                <button
                  type="button"
                  className="grid size-6 flex-shrink-0 place-items-center rounded-sm border-[0.5px] border-strong-1 text-tertiary transition-colors hover:bg-layer-1"
                  onClick={() => handleColorSelect("background-color", undefined)}
                >
                  <Ban className="size-4" />
                </button>
              </div>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
});

ColorDropdown.displayName = "ColorDropdown";

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { DeactivatedOutline, TextOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { ToolbarMenuTriggerButton, ToolbarMenuTriggerLabel } from "@makeplane/propel/components/toolbar";
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
    <Popover>
      {/* Propel's ToolbarMenuTrigger only wraps a Menu; this is its Popover twin until Propel ships one */}
      <PopoverTrigger render={<ToolbarMenuTriggerButton aria-label="Color" />}>
        <ToolbarMenuTriggerLabel>Color</ToolbarMenuTriggerLabel>
        {/* active text + background colour preview */}
        <span
          className={cn("grid size-5 shrink-0 place-items-center rounded-sm border-[0.5px] border-strong", {
            "bg-surface-1": !activeBackgroundColor,
          })}
          style={{
            backgroundColor: activeBackgroundColor ? activeBackgroundColor.backgroundColor : "transparent",
          }}
        >
          <TextOutline
            className={cn("size-3.5", {
              "text-primary": !activeTextColor,
            })}
            style={{
              color: activeTextColor ? activeTextColor.textColor : "inherit",
            }}
          />
        </span>
        <span className="inline-flex transition-transform duration-200 group-data-popup-open:rotate-180">
          <Icon icon={ChevronDown} tint="secondary" />
        </span>
      </PopoverTrigger>
      <PopoverContent variant="rich" side="bottom" align="start">
        <div className="space-y-1.5">
          <p className="text-11 font-semibold text-tertiary">Text colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                aria-label={color.label}
                aria-pressed={isColorActive("text-color", color.key)}
                className="size-6 flex-shrink-0 rounded-sm border-[0.5px] border-strong-1 transition-opacity hover:opacity-60"
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => handleColorSelect("text-color", color.key)}
              />
            ))}
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Remove text color"
              icon={<Icon icon={DeactivatedOutline} />}
              onClick={() => handleColorSelect("text-color", undefined)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-11 font-semibold text-tertiary">Background colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                aria-label={color.label}
                aria-pressed={isColorActive("background-color", color.key)}
                className="size-6 flex-shrink-0 rounded-sm border-[0.5px] border-strong-1 transition-opacity hover:opacity-60"
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => handleColorSelect("background-color", color.key)}
              />
            ))}
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Remove background color"
              icon={<Icon icon={DeactivatedOutline} />}
              onClick={() => handleColorSelect("background-color", undefined)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

ColorDropdown.displayName = "ColorDropdown";

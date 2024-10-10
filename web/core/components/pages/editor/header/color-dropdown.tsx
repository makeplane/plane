"use client";

import { memo } from "react";
import { ALargeSmall, Ban } from "lucide-react";
import { Popover } from "@headlessui/react";
// plane editor
import { COLORS_LIST, TColorEditorCommands } from "@plane/editor";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  handleColorSelect: (key: TColorEditorCommands, color: string | undefined) => void;
  isColorActive: (key: TColorEditorCommands, color: string | undefined) => boolean;
};

export const ColorDropdown: React.FC<Props> = memo((props) => {
  const { handleColorSelect, isColorActive } = props;

  const activeTextColor = COLORS_LIST.find((c) => isColorActive("text-color", c.textColor));
  const activeBackgroundColor = COLORS_LIST.find((c) => isColorActive("background-color", c.backgroundColor));

  return (
    <Popover as="div" className="h-7 px-2">
      <Popover.Button
        as="button"
        type="button"
        className={({ open }) =>
          cn("h-full", {
            "outline-none": open,
          })
        }
      >
        {({ open }) => (
          <span
            className={cn(
              "h-full px-2 text-custom-text-300 text-sm flex items-center gap-1.5 rounded hover:bg-custom-background-80",
              {
                "text-custom-text-100 bg-custom-background-80": open,
              }
            )}
          >
            Color
            <span
              className={cn(
                "flex-shrink-0 size-6 grid place-items-center rounded border-[0.5px] border-custom-border-300",
                {
                  "bg-custom-background-100": !activeBackgroundColor,
                }
              )}
              style={
                activeBackgroundColor
                  ? {
                      backgroundColor: activeBackgroundColor.backgroundColor,
                    }
                  : {}
              }
            >
              <ALargeSmall
                className={cn("size-3.5", {
                  "text-custom-text-100": !activeTextColor,
                })}
                style={
                  activeTextColor
                    ? {
                        color: activeTextColor.textColor,
                      }
                    : {}
                }
              />
            </span>
          </span>
        )}
      </Popover.Button>
      <Popover.Panel
        as="div"
        className="fixed z-20 mt-1 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg p-2 space-y-2"
      >
        <div className="space-y-1.5">
          <p className="text-xs text-custom-text-300 font-semibold">Text colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.textColor}
                type="button"
                className="flex-shrink-0 size-6 rounded border-[0.5px] border-custom-border-400 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => handleColorSelect("text-color", color.textColor)}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-300 border-[0.5px] border-custom-border-400 hover:bg-custom-background-80 transition-colors"
              onClick={() => handleColorSelect("text-color", undefined)}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-custom-text-300 font-semibold">Background colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.backgroundColor}
                type="button"
                className="flex-shrink-0 size-6 rounded border-[0.5px] border-custom-border-400 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => handleColorSelect("background-color", color.backgroundColor)}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-300 border-[0.5px] border-custom-border-400 hover:bg-custom-background-80 transition-colors"
              onClick={() => handleColorSelect("background-color", undefined)}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
});

ColorDropdown.displayName = "ColorDropdown";

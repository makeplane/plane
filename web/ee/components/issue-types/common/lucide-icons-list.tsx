import React, { useState } from "react";
// components
import { Check, Search } from "lucide-react";
// plane imports
import { DEFAULT_BACKGROUND_COLORS } from "@plane/constants";
import { TLogoProps } from "@plane/types";
// ui
import { ColorPicker, Input, LUCIDE_ICONS_LIST } from "@plane/ui";
// helpers
import { generateIconColors } from "@/helpers/color.helper";

export type TIconsListProps = {
  defaultBackgroundColor?: string;
  onChange: (val: TLogoProps["icon"], shouldClose: boolean) => void;
};

export const LucideIconsList: React.FC<TIconsListProps> = (props) => {
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
      <div className="flex flex-col gap-3 sticky top-0 p-2.5 bg-custom-background-100">
        <div
          className={`relative flex items-center gap-2 bg-custom-background-90 h-8 rounded-lg w-full px-[30px] border ${
            isInputFocused ? "border-custom-primary-100" : "border-transparent"
          }`}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        >
          <Search className="absolute left-2.5 bottom-2 h-3.5 w-3.5 text-custom-text-400" />
          <Input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-[1rem] border-none p-0 h-full w-full"
          />
        </div>

        <div>
          <div className="w-full text-sm text-custom-text-200">Choose background color</div>
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
                    <Check className="absolute inset-0 m-auto text-white size-3" strokeWidth={3} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="w-full text-sm text-custom-text-200">Pick icon</div>
          <div className="grid grid-cols-8 gap-1 justify-items-center mt-2">
            {filteredArray.map((icon) => (
              <button
                key={icon.name}
                type="button"
                className="h-9 w-9 select-none text-lg grid place-items-center rounded hover:bg-custom-background-80"
                onClick={() => {
                  onChange(
                    {
                      name: icon.name,
                    },
                    true
                  );
                }}
              >
                <icon.element className="size-4 text-custom-text-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

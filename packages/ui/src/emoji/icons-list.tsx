import React, { useEffect, useState } from "react";
// components
import { Input } from "../form-fields";
// helpers
import { cn } from "../../helpers";
import { DEFAULT_COLORS, TIconsListProps, adjustColorForContrast } from "./emoji-icon-helper";
// icons
import { MATERIAL_ICONS_LIST } from "./icons";
import { InfoIcon } from "../icons";
import { Search } from "lucide-react";

export const IconsList: React.FC<TIconsListProps> = (props) => {
  const { defaultColor, onChange } = props;
  // states
  const [activeColor, setActiveColor] = useState(defaultColor);
  const [showHexInput, setShowHexInput] = useState(false);
  const [hexValue, setHexValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (DEFAULT_COLORS.includes(defaultColor.toLowerCase())) setShowHexInput(false);
    else {
      setHexValue(defaultColor.slice(1, 7));
      setShowHexInput(true);
    }
  }, [defaultColor]);

  const filteredArray = MATERIAL_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="flex items-center px-2 py-[15px] w-full ">
        <div
          className={`relative flex items-center gap-2 bg-custom-background-90 h-10 rounded-lg w-full px-[30px] border ${isInputFocused ? "border-custom-primary-100" : "border-transparent"}`}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        >
          <Search className="absolute left-2.5 bottom-3 h-3.5 w-3.5 text-custom-text-400" />
          <Input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-[1rem] border-none p-0 h-full w-full "
          />
        </div>
      </div>
      <div className="grid grid-cols-9 gap-2 items-center justify-items-center px-2.5 py-1 h-9">
        {showHexInput ? (
          <div className="col-span-8 flex items-center gap-1 justify-self-stretch ml-2">
            <span
              className="h-4 w-4 flex-shrink-0 rounded-full mr-1"
              style={{
                backgroundColor: `#${hexValue}`,
              }}
            />
            <span className="text-xs text-custom-text-300 flex-shrink-0">HEX</span>
            <span className="text-xs text-custom-text-200 flex-shrink-0 -mr-1">#</span>
            <Input
              type="text"
              value={hexValue}
              onChange={(e) => {
                const value = e.target.value;
                setHexValue(value);
                if (/^[0-9A-Fa-f]{6}$/.test(value)) setActiveColor(adjustColorForContrast(`#${value}`));
              }}
              className="flex-grow pl-0 text-xs text-custom-text-200"
              mode="true-transparent"
              autoFocus
            />
          </div>
        ) : (
          DEFAULT_COLORS.map((curCol) => (
            <button
              key={curCol}
              type="button"
              className="grid place-items-center size-5"
              onClick={() => {
                setActiveColor(curCol);
                setHexValue(curCol.slice(1, 7));
              }}
            >
              <span className="h-4 w-4 cursor-pointer rounded-full" style={{ backgroundColor: curCol }} />
            </button>
          ))
        )}
        <button
          type="button"
          className={cn("grid place-items-center h-4 w-4 rounded-full border border-transparent", {
            "border-custom-border-400": !showHexInput,
          })}
          onClick={() => {
            setShowHexInput((prevData) => !prevData);
            setHexValue(activeColor.slice(1, 7));
          }}
        >
          {showHexInput ? (
            <span className="conical-gradient h-4 w-4 rounded-full" />
          ) : (
            <span className="text-custom-text-300 text-[0.6rem] grid place-items-center">#</span>
          )}
        </button>
      </div>
      <div className="flex items-center gap-2 w-full pl-4 pr-3 py-1 h-6">
        <InfoIcon className="h-3 w-3" />
        <p className="text-xs"> Colors will be adjusted to ensure sufficient contrast.</p>
      </div>
      <div className="grid grid-cols-8 gap-1 px-2.5 justify-items-center mt-2">
        {filteredArray.map((icon) => (
          <button
            key={icon.name}
            type="button"
            className="h-9 w-9 select-none text-lg grid place-items-center rounded hover:bg-custom-background-80"
            onClick={() => {
              onChange({
                name: icon.name,
                color: activeColor,
              });
            }}
          >
            <span
              style={{ color: activeColor }}
              className="material-symbols-rounded !text-[1.25rem] !leading-[1.25rem]"
            >
              {icon.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

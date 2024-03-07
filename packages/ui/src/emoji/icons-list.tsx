import React, { useEffect, useState } from "react";
// components
import { Input } from "../form-fields";
// helpers
import { cn } from "../../helpers";
// constants
import { MATERIAL_ICONS_LIST } from "./icons";

type TIconsListProps = {
  defaultColor: string;
  onChange: (val: { name: string; color: string }) => void;
};

const DEFAULT_COLORS = ["#ff6b00", "#8cc1ff", "#fcbe1d", "#18904f", "#adf672", "#05c3ff", "#5f5f5f"];

export const IconsList: React.FC<TIconsListProps> = (props) => {
  const { defaultColor, onChange } = props;
  // states
  const [activeColor, setActiveColor] = useState(defaultColor);
  const [showHexInput, setShowHexInput] = useState(false);
  const [hexValue, setHexValue] = useState("");

  useEffect(() => {
    if (DEFAULT_COLORS.includes(defaultColor.toLowerCase())) setShowHexInput(false);
    else {
      setHexValue(defaultColor.slice(1, 7));
      setShowHexInput(true);
    }
  }, [defaultColor]);

  return (
    <>
      <div className="grid grid-cols-8 gap-2 items-center justify-items-center px-2.5 h-9">
        {showHexInput ? (
          <div className="col-span-7 flex items-center gap-1 justify-self-stretch ml-2">
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
                if (/^[0-9A-Fa-f]{6}$/.test(value)) setActiveColor(`#${value}`);
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
              className="grid place-items-center"
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
      <div className="grid grid-cols-8 gap-2 px-2.5 justify-items-center mt-2">
        {MATERIAL_ICONS_LIST.map((icon) => (
          <button
            key={icon.name}
            type="button"
            className="h-6 w-6 select-none text-lg grid place-items-center rounded hover:bg-custom-background-80"
            onClick={() => {
              onChange({
                name: icon.name,
                color: activeColor,
              });
            }}
          >
            <span style={{ color: activeColor }} className="material-symbols-rounded text-base">
              {icon.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

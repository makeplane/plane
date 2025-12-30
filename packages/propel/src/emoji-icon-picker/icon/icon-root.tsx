import React, { useEffect, useState } from "react";
import { InfoIcon } from "lucide-react";
import { SearchIcon } from "../../icons";
import { cn } from "../../utils/classname";
import { adjustColorForContrast, DEFAULT_COLORS } from "../helper";
import { LucideIconsList } from "./lucide-root";
import { MaterialIconList } from "./material-root";

type IconRootProps = {
  onChange: (value: { name: string; color: string }) => void;
  defaultColor: string;
  searchDisabled?: boolean;
  iconType: "material" | "lucide";
};

export function IconRoot(props: IconRootProps) {
  const { defaultColor, onChange, searchDisabled = false, iconType } = props;
  // states
  const [activeColor, setActiveColor] = useState(defaultColor);
  const [showHexInput, setShowHexInput] = useState(false);
  const [hexValue, setHexValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (DEFAULT_COLORS.includes(defaultColor.toLowerCase() ?? "")) setShowHexInput(false);
    else {
      setHexValue(defaultColor?.slice(1, 7) ?? "");
      setShowHexInput(true);
    }
  }, [defaultColor]);

  return (
    <>
      <div className="flex flex-col sticky top-0 bg-surface-1">
        {!searchDisabled && (
          <div className="flex items-center px-2 py-[15px] w-full ">
            <div
              className={cn("relative flex items-center gap-2 bg-surface-2 h-10 rounded-lg w-full px-[30px] border", {
                "border-accent-strong": isInputFocused,
                "border-transparent": !isInputFocused,
              })}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            >
              <SearchIcon className="absolute left-2.5 bottom-3 h-3.5 w-3.5 text-placeholder" />

              <input
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block rounded-md bg-transparent placeholder-(--text-color-placeholder) focus:outline-none px-3 py-2 border-[0.5px] border-subtle text-16 border-none p-0 h-full w-full"
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-9 gap-2 items-center justify-items-center px-2.5 py-1 h-9">
          {showHexInput ? (
            <div className="col-span-8 flex items-center gap-1 justify-self-stretch ml-2">
              <span
                className="h-4 w-4 flex-shrink-0 rounded-full mr-1"
                style={{
                  backgroundColor: `#${hexValue}`,
                }}
              />
              <span className="text-11 text-tertiary flex-shrink-0">HEX</span>
              <span className="text-11 text-secondary flex-shrink-0 -mr-1">#</span>
              <input
                type="text"
                value={hexValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setHexValue(value);
                  if (/^[0-9A-Fa-f]{6}$/.test(value)) setActiveColor(adjustColorForContrast(`#${value}`));
                }}
                className="block placeholder-(--text-color-placeholder) focus:outline-none px-3 py-2 border-[0.5px] border-subtle flex-grow pl-0 text-11 text-secondary rounded-sm border-none bg-transparent ring-0"
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
              "border-strong-1": !showHexInput,
            })}
            onClick={() => {
              setShowHexInput((prevData) => !prevData);
              setHexValue(activeColor.slice(1, 7));
            }}
          >
            {showHexInput ? (
              <span className="conical-gradient h-4 w-4 rounded-full" />
            ) : (
              <span className="text-tertiary text-10 grid place-items-center">#</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full pl-4 pr-3 py-1 h-6">
          <InfoIcon className="h-3 w-3" />
          <p className="text-11"> Colors will be adjusted to ensure sufficient contrast.</p>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1 px-2.5 justify-items-center mt-2">
        {iconType === "material" ? (
          <MaterialIconList query={query} onChange={onChange} activeColor={activeColor} />
        ) : (
          <LucideIconsList query={query} onChange={onChange} activeColor={activeColor} />
        )}
      </div>
    </>
  );
}

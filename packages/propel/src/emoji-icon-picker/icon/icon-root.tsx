/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
      <div className="sticky top-0 flex flex-col bg-surface-1">
        {!searchDisabled && (
          <div className="flex w-full items-center px-2 py-[15px]">
            <div
              className={cn("relative flex h-10 w-full items-center gap-2 rounded-lg border bg-surface-2 px-[30px]", {
                "border-accent-strong": isInputFocused,
                "border-transparent": !isInputFocused,
              })}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            >
              <SearchIcon className="absolute bottom-3 left-2.5 h-3.5 w-3.5 text-placeholder" />

              <input
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block h-full w-full rounded-md border-[0.5px] border-none border-subtle bg-transparent p-0 px-3 py-2 text-16 placeholder-(--text-color-placeholder) focus:outline-none"
              />
            </div>
          </div>
        )}
        <div className="grid h-9 grid-cols-9 items-center justify-items-center gap-2 px-2.5 py-1">
          {showHexInput ? (
            <div className="col-span-8 ml-2 flex items-center gap-1 justify-self-stretch">
              <span
                className="mr-1 h-4 w-4 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: `#${hexValue}`,
                }}
              />
              <span className="flex-shrink-0 text-11 text-tertiary">HEX</span>
              <span className="-mr-1 flex-shrink-0 text-11 text-secondary">#</span>
              <input
                type="text"
                value={hexValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setHexValue(value);
                  if (/^[0-9A-Fa-f]{6}$/.test(value)) setActiveColor(adjustColorForContrast(`#${value}`));
                }}
                className="block flex-grow rounded-sm border-[0.5px] border-none border-subtle bg-transparent px-3 py-2 pl-0 text-11 text-secondary placeholder-(--text-color-placeholder) ring-0 focus:outline-none"
                autoFocus
              />
            </div>
          ) : (
            DEFAULT_COLORS.map((curCol) => (
              <button
                key={curCol}
                type="button"
                className="grid size-5 place-items-center"
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
            className={cn("grid h-4 w-4 place-items-center rounded-full border border-transparent", {
              "border-strong-1": !showHexInput,
            })}
            onClick={() => {
              setShowHexInput((prevData) => !prevData);
              setHexValue(activeColor.slice(1, 7));
            }}
          >
            {showHexInput ? (
              <span className="h-4 w-4 rounded-full conical-gradient" />
            ) : (
              <span className="grid place-items-center text-10 text-tertiary">#</span>
            )}
          </button>
        </div>
        <div className="flex h-6 w-full items-center gap-2 py-1 pr-3 pl-4">
          <InfoIcon className="h-3 w-3" />
          <p className="text-11"> Colors will be adjusted to ensure sufficient contrast.</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-8 justify-items-center gap-1 px-2.5">
        {iconType === "material" ? (
          <MaterialIconList query={query} onChange={onChange} activeColor={activeColor} />
        ) : (
          <LucideIconsList query={query} onChange={onChange} activeColor={activeColor} />
        )}
      </div>
    </>
  );
}

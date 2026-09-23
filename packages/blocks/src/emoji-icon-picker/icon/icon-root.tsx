/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";

import { SearchOutline, InfoOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { adjustColorForContrast, DEFAULT_COLORS } from "../helper";
import { LucideIconsList } from "./lucide-root";
import { MaterialIconList } from "./material-root";

type IconRootProps = {
  onChange: (value: { name: string; color: string }) => void;
  defaultColor: string;
  searchPlaceholder?: string;
  searchDisabled?: boolean;
  iconType: "material" | "lucide";
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
};

export function IconRoot(props: IconRootProps) {
  const {
    defaultColor,
    onChange,
    searchPlaceholder,
    searchDisabled = false,
    iconType,
    searchQuery,
    onSearchQueryChange,
  } = props;
  const { t } = useTranslation();
  const searchLabel = searchPlaceholder ?? t("common.search.label");
  // states
  const [activeColor, setActiveColor] = useState(defaultColor);
  const [showHexInput, setShowHexInput] = useState(false);
  const [hexValue, setHexValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  // use shared search query from parent
  const query = searchQuery ?? "";

  useEffect(() => {
    if (DEFAULT_COLORS.includes(defaultColor.toLowerCase() ?? "")) setShowHexInput(false);
    else {
      setHexValue(defaultColor?.slice(1, 7) ?? "");
      setShowHexInput(true);
    }
  }, [defaultColor]);

  return (
    <>
      {/* Sticky inside the tab panel's scrollport — needs an opaque background or icons scroll underneath. */}
      <div className="sticky top-0 flex flex-col bg-layer-2">
        {!searchDisabled && (
          <div className="flex w-full items-center px-2 py-[15px]">
            <div
              className={cn("relative flex h-10 w-full items-center gap-2 rounded-lg border px-[30px]", {
                "border-accent-strong": isInputFocused,
                "border-transparent": !isInputFocused,
              })}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            >
              <SearchOutline aria-hidden="true" className="absolute bottom-3 left-2.5 h-3.5 w-3.5 text-placeholder" />

              <input
                placeholder={searchLabel}
                aria-label={searchLabel}
                value={query}
                onChange={(e) => onSearchQueryChange?.(e.target.value)}
                className="block h-full w-full rounded-md border-[0.5px] border-none border-subtle bg-transparent p-0 px-3 py-2 text-body-md-regular placeholder-(--text-color-placeholder) focus:outline-none"
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
              <span className="flex-shrink-0 text-caption-sm-regular text-tertiary">HEX</span>
              <span className="-mr-1 flex-shrink-0 text-caption-sm-regular text-secondary">#</span>
              <input
                type="text"
                value={hexValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setHexValue(value);
                  if (/^[0-9A-Fa-f]{6}$/.test(value)) setActiveColor(adjustColorForContrast(`#${value}`));
                }}
                className="block flex-grow rounded-sm border-[0.5px] border-none border-subtle bg-transparent px-3 py-2 pl-0 text-caption-sm-regular text-secondary placeholder-(--text-color-placeholder) ring-0 focus:outline-none"
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
              <span className="grid place-items-center text-caption-xs-regular text-tertiary">#</span>
            )}
          </button>
        </div>
        <div className="flex h-6 w-full items-center gap-2 py-1 pr-3 pl-4">
          <InfoOutline className="h-3 w-3" />
          <p className="text-caption-sm-regular"> Colors will be adjusted to ensure sufficient contrast.</p>
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

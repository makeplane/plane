"use client";

import React from "react";
import useFontFaceObserver from "use-font-face-observer";
import { MATERIAL_ICONS_LIST } from "../material-icons";

type MaterialIconListProps = {
  onChange: (value: { name: string; color: string }) => void;
  activeColor: string;
  query: string;
};

export const MaterialIconList: React.FC<MaterialIconListProps> = (props) => {
  const { query, onChange, activeColor } = props;

  const filteredArray = MATERIAL_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

  const isMaterialSymbolsFontLoaded = useFontFaceObserver([
    {
      family: `Material Symbols Rounded`,
      style: `normal`,
      weight: `normal`,
      stretch: `condensed`,
    },
  ]);

  return (
    <>
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
          {isMaterialSymbolsFontLoaded ? (
            <span
              style={{ color: activeColor }}
              className="material-symbols-rounded !text-[1.25rem] !leading-[1.25rem]"
            >
              {icon.name}
            </span>
          ) : (
            <span className="size-5 rounded animate-pulse bg-custom-background-80" />
          )}
        </button>
      ))}
    </>
  );
};

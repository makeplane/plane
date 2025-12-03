import React from "react";
import { LUCIDE_ICONS_LIST } from "../lucide-icons";

type LucideIconsListProps = {
  onChange: (value: { name: string; color: string }) => void;
  activeColor: string;
  query: string;
};

export function LucideIconsList(props: LucideIconsListProps) {
  const { query, onChange, activeColor } = props;

  const filteredArray = LUCIDE_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {filteredArray.map((icon) => (
        <button
          key={icon.name}
          type="button"
          className="h-9 w-9 select-none text-16 grid place-items-center rounded-sm hover:bg-layer-1"
          onClick={() => {
            onChange({
              name: icon.name,
              color: activeColor,
            });
          }}
        >
          <icon.element style={{ color: activeColor }} className="size-4" />
        </button>
      ))}
    </>
  );
}

import React from "react";
import { LUCIDE_ICONS_LIST } from "../lucide-icons";

type LucideIconsListProps = {
  onChange: (value: { name: string; color: string }) => void;
  activeColor: string;
  query: string;
};

export const LucideIconsList: React.FC<LucideIconsListProps> = (props) => {
  const { query, onChange, activeColor } = props;

  const filteredArray = LUCIDE_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

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
          <icon.element style={{ color: activeColor }} className="size-4" />
        </button>
      ))}
    </>
  );
};

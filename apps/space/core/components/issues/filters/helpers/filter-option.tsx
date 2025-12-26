import React from "react";
// plane imports
import { CheckIcon } from "@plane/propel/icons";

type Props = {
  icon?: React.ReactNode;
  isChecked: boolean;
  title: React.ReactNode;
  onClick?: () => void;
  multiple?: boolean;
};

export function FilterOption(props: Props) {
  const { icon, isChecked, multiple = true, onClick, title } = props;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-sm p-1.5 hover:bg-layer-transparent-hover"
      onClick={onClick}
    >
      <div
        className={`grid h-3 w-3 shrink-0 place-items-center border ${
          isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
        } ${multiple ? "rounded-xs" : "rounded-full"}`}
      >
        {isChecked && <CheckIcon width={10} height={10} strokeWidth={3} />}
      </div>
      <div className="flex items-center gap-2 truncate">
        {icon && <div className="grid w-5 shrink-0 place-items-center">{icon}</div>}
        <div className="grow truncate text-11 text-secondary">{title}</div>
      </div>
    </button>
  );
}

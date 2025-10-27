import type { FC } from "react";
import React from "react";
import { cn } from "@plane/utils";

type Props = React.ComponentProps<"button"> & {
  label: React.ReactNode;
  onClick: () => void;
};

export const SidebarAddButton: FC<Props> = (props) => {
  const { label, onClick, disabled, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        "flex-grow text-custom-text-300 text-sm font-medium border-[0.5px] border-custom-sidebar-border-300 text-left rounded-md shadow-sm h-8 px-2 flex items-center gap-1.5",
        !disabled && "hover:bg-custom-sidebar-background-90"
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  );
};

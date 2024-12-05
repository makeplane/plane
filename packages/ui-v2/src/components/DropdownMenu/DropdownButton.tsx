import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import React, { createContext, useState, useEffect, useContext } from "react";
import { DropdownMenuContext } from "./DropdownMenu";

type DropdownButtonProps = {
  children: React.ReactNode;
  showIcon?: boolean;
};

export const DropdownButton = ({
  children,
  showIcon = false,
}: DropdownButtonProps) => {
  const { setOpen } = useContext(DropdownMenuContext);

  return (
    <RadixDropdownMenu.Trigger
      className="inline-flex h-[35px]  
    items-center justify-between gap-[5px] rounded bg-white px-[15px] text-[13px] leading-none"
      aria-label="Food"
      asChild
      //   onClick={() => setOpen(true)}
    >
      <button>
        {children}
        {showIcon && <ChevronDownIcon />}
      </button>
    </RadixDropdownMenu.Trigger>
  );
};

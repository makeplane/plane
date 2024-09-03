"use client";

import { FC, ReactNode } from "react";
import { X } from "lucide-react";

type TAppliedFilterGroupItem = {
  onClear?: () => void;
  children: ReactNode;
};

export const AppliedFilterGroupItem: FC<TAppliedFilterGroupItem> = (props) => {
  const { children, onClear } = props;

  return (
    <div className="flex items-center gap-2 border border-custom-border-200 rounded p-1">
      {children}
      {onClear && (
        <div
          className="rounded flex-shrink-0 w-4 h-4 flex justify-center items-center cursor-pointer transition-all bg-custom-background-90 hover:bg-custom-background-100 text-custom-text-200 hover:text-custom-text-100"
          onClick={onClear}
        >
          <X className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

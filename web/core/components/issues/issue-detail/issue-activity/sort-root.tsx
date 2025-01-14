"use client";

import { FC, memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";

export type TActivitySortRoot = {
  sortOrder: E_SORT_ORDER;
  toggleSort: () => void;
  className?: string;
  iconClassName?: string;
};
export const ActivitySortRoot: FC<TActivitySortRoot> = memo((props) => (
  <div
    className={cn(
      getButtonStyling("neutral-primary", "sm"),
      "px-2 text-custom-text-300 cursor-pointer",
      props.className
    )}
    onClick={() => {
      props.toggleSort();
    }}
  >
    {props.sortOrder === "asc" ? (
      <ArrowUpWideNarrow className={cn("size-4", props.iconClassName)} />
    ) : (
      <ArrowDownWideNarrow className={cn("size-4", props.iconClassName)} />
    )}
  </div>
));

ActivitySortRoot.displayName = "ActivitySortRoot";

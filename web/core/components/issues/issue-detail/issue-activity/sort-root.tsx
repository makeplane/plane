"use client";

import { FC, memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import { getButtonStyling } from "@plane/ui";
import { TSORT_ORDER } from "@/constants/common";
// helpers
import { cn } from "@/helpers/common.helper";

export type TActivitySortRoot = {
  sortOrder: TSORT_ORDER;
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

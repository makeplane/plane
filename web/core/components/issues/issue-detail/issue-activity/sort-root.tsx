"use client";

import { FC, memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

export type TActivitySortRoot = {
  sortOrder: "asc" | "desc";
  toggleSort: () => void;
};
export const ActivitySortRoot: FC<TActivitySortRoot> = memo((props) => (
  <div
    className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300 cursor-pointer")}
    onClick={() => {
      props.toggleSort();
    }}
  >
    {props.sortOrder === "asc" ? (
      <ArrowUpWideNarrow className="size-4 " />
    ) : (
      <ArrowDownWideNarrow className="size-4 " />
    )}
  </div>
));

ActivitySortRoot.displayName = "ActivitySortRoot";

import { memo } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { cn } from "@plane/utils";
import { Button } from "@plane/propel/button";

export type TActivitySortRoot = {
  sortOrder: E_SORT_ORDER;
  toggleSort: () => void;
  className?: string;
  iconClassName?: string;
};
export const ActivitySortRoot = memo(function ActivitySortRoot(props: TActivitySortRoot) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={props.className}
      onClick={() => {
        props.toggleSort();
      }}
    >
      {props.sortOrder === E_SORT_ORDER.ASC ? (
        <ArrowUpWideNarrow className={cn("size-4", props.iconClassName)} />
      ) : (
        <ArrowDownWideNarrow className={cn("size-4", props.iconClassName)} />
      )}
    </Button>
  );
});

ActivitySortRoot.displayName = "ActivitySortRoot";

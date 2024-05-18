import React, { FC } from "react";
import { ChevronDown } from "lucide-react";
// types
import { TCycleGroups } from "@plane/types";
// icons
import { CycleGroupIcon } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  type: TCycleGroups;
  title: string;
  count?: number;
  showCount?: boolean;
  isExpanded?: boolean;
};

export const CycleListGroupHeader: FC<Props> = (props) => {
  const { type, title, count, showCount = false, isExpanded = false } = props;
  return (
    <div className="relative flex items-center justify-between w-full gap-5 py-1.5">
      <div className="flex items-center gap-5 flex-shrink-0">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
          <CycleGroupIcon cycleGroup={type} className="h-5 w-5" />
        </div>

        <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden">
          <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{title}</div>
          {showCount && <div className="pl-2 text-sm font-medium text-custom-text-300">{`${count ?? "0"}`}</div>}
        </div>
      </div>
      <ChevronDown
        className={cn("h-4 w-4 text-custom-sidebar-text-300 duration-300 ", {
          "rotate-180": isExpanded,
        })}
      />
    </div>
  );
};

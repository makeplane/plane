"use client";

import { FC, useMemo } from "react";
//
import { cn } from "@/helpers/common.helper";

type TCountChip = {
  count: string | number | null | undefined;
  className?: string;
  hasMore?: boolean;
  perPage?: number;
};

export const CountChip: FC<TCountChip> = (props) => {
  const { count, className = "", hasMore = false, perPage = 100 } = props;

  const displayCount = useMemo(() => {
    if (count !== null && count !== undefined) {
      return count;
    }
    if (hasMore) {
      return `${perPage}+`;
    }
    return null;
  }, [count, hasMore, perPage]);

  if (displayCount === null) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex justify-center items-center px-2.5 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl",
        className
      )}
    >
      {displayCount}
    </div>
  );
};

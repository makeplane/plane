"use client";

import { FC } from "react";
//
import { cn } from "@/helpers/common.helper";

type TCountChip = {
  count: string | number;
  className?: string;
};

export const CountChip: FC<TCountChip> = (props) => {
  const { count, className = "" } = props;

  return (
    <div
      className={cn(
        "relative flex justify-center items-center px-2.5 py-0.5 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl",
        className
      )}
    >
      {count}
    </div>
  );
};

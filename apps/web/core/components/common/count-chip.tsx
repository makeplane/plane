import type { FC } from "react";
//
import { cn } from "@plane/utils";

type TCountChip = {
  count: string | number;
  className?: string;
};

export function CountChip(props: TCountChip) {
  const { count, className = "" } = props;

  return (
    <div
      className={cn(
        "relative flex justify-center items-center px-2.5 py-0.5 flex-shrink-0 bg-accent-primary/20 text-accent-primary text-caption-sm-semibold rounded-xl",
        className
      )}
    >
      {count}
    </div>
  );
}

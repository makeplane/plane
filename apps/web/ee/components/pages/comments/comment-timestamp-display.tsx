import React from "react";
import { calculateTimeAgoShort, cn } from "@plane/utils";

type TimeDisplayProps = {
  timestamp: string;
  className?: string;
  showResolved?: boolean;
};

export const PageCommentTimestampDisplay = ({ timestamp, className = "", showResolved = false }: TimeDisplayProps) => (
  <div
    className={cn(
      "text-custom-text-300 text-[10px] leading-[14px] overflow-hidden text-ellipsis whitespace-nowrap",
      className
    )}
  >
    {calculateTimeAgoShort(timestamp)}
    {showResolved && <span className="ml-2 text-green-600">Resolved</span>}
  </div>
);

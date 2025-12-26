import React from "react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "../utils";

type Props = {
  data: any;
  noTooltip?: boolean;
  inPercentage?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  barClassName?: string;
};

export function LinearProgressIndicator({
  data,
  noTooltip = false,
  inPercentage = false,
  size = "sm",
  className = "",
  barClassName = "",
}: Props) {
  const total = data.reduce((acc: any, cur: any) => acc + cur.value, 0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let progress = 0;

  const bars = data.map((item: any) => {
    const width = `${(item.value / total) * 100}%`;
    if (width === "0%") return <></>;
    const style = {
      width,
      backgroundColor: item.color,
    };
    progress += item.value;
    if (noTooltip) return <div style={style} key={item.id} />;
    else
      return (
        <Tooltip key={item.id} tooltipContent={`${item.name} ${Math.round(item.value)}${inPercentage ? "%" : ""}`}>
          <div style={style} className={cn("first:rounded-l-xs last:rounded-r-xs", barClassName)} />
        </Tooltip>
      );
  });

  return (
    <div
      className={cn("flex w-full items-center justify-between gap-[1px] rounded-xs", {
        "h-2": size === "sm",
        "h-3": size === "md",
        "h-3.5": size === "lg",
        "h-[14px]": size === "xl",
      })}
    >
      <div className={cn("flex h-full w-full gap-[1.5px] p-[2px] bg-surface-2 rounded-xs", className)}>{bars}</div>
    </div>
  );
}

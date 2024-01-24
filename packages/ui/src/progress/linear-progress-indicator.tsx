import React from "react";
import { Tooltip } from "../tooltip";

type Props = {
  data: any;
  noTooltip?: boolean;
  inPercentage?: boolean;
};

export const LinearProgressIndicator: React.FC<Props> = ({ data, noTooltip = false, inPercentage = false }) => {
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
    if (noTooltip) return <div style={style} />;
    else
      return (
        <Tooltip key={item.id} tooltipContent={`${item.name} ${Math.round(item.value)}%`}>
          <div style={style} className="first:rounded-l-full last:rounded-r-full" />
        </Tooltip>
      );
  });

  return (
    <div className="flex h-1 w-full items-center justify-between gap-1">
      {total === 0 ? (
        <div className="flex h-full w-full gap-1 bg-neutral-500">{bars}</div>
      ) : (
        <div className="flex h-full w-full gap-1">{bars}</div>
      )}
    </div>
  );
};

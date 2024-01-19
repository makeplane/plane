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

  const bars = data.map((item: any, index: Number) => {
    const width = `${(item.value / total) * 100}%`;
    const style = {
      width,
      backgroundColor: item.color,
      borderTopLeftRadius: index === 0 ? "99px" : 0,
      borderBottomLeftRadius: index === 0 ? "99px" : 0,
      borderTopRightRadius: index === data.length - 1 ? "99px" : 0,
      borderBottomRightRadius: index === data.length - 1 ? "99px" : 0,
    };
    progress += item.value;
    if (noTooltip) return <div style={style} />;
    if (width === "0%") return <></>;
    else
      return (
        <Tooltip key={item.id} tooltipContent={`${item.name} ${Math.round(item.value)}${inPercentage ? "%" : ""}`}>
          <div style={style} />
        </Tooltip>
      );
  });

  return (
    <div className="flex h-1.5 w-full items-center justify-between gap-1 rounded-l-full rounded-r-full">
      {total === 0 ? (
        <div className="flex h-full w-full gap-1 bg-neutral-500">{bars}</div>
      ) : (
        <div className="flex h-full w-full gap-1">{bars}</div>
      )}
    </div>
  );
};

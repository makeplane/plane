import React from "react";
import { Tooltip } from "./tooltip";

type Props = {
  data: any;
};

export const LinearProgressIndicator: React.FC<Props> = ({ data }) => {
  const total = data.reduce((acc: any, cur: any) => acc + cur.value, 0);
  let progress = 0;

  const bars = data.map((item: any) => {
    const width = `${(item.value / total) * 100}%`;
    const style = {
      width,
      backgroundColor: item.color,
    };
    progress += item.value;

    return (
      <Tooltip tooltipContent={`${item.name} ${item.value}%`}>
        <div key={item.id} className="bar" style={style} />
      </Tooltip>
    );
  });

  return (
    <div className="flex h-1 w-full items-center justify-between  gap-1">
      {total === 0 ? " - 0%" : <div className="flex h-full w-full gap-1 rounded-md">{bars}</div>}
    </div>
  );
};

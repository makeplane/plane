import React from "react";

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
    return <div key={item.id} className="bar" style={style}></div>;
  });

  return (
    <div className="flex justify-between items-center h-1 gap-1  w-full">
      <div className="flex h-full w-full rounded-md gap-1">{bars}</div>
    </div>
  );
};

"use client";

import { FC, ReactNode } from "react";

type TIconFieldRender = {
  icon?: ReactNode;
  title?: string;
};

export const IconFieldRender: FC<TIconFieldRender> = (props) => {
  const { icon, title } = props;

  if (!icon && !title) return "-";
  if (!icon && title) return title;
  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
        {icon}
      </div>
      <div className="relative whitespace-nowrap line-clamp-1">{title}</div>
    </div>
  );
};

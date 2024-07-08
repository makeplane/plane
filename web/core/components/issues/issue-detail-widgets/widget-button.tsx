"use client";
import React, { FC } from "react";

type Props = {
  icon: JSX.Element;
  title: string;
};

export const IssueDetailWidgetButton: FC<Props> = (props) => {
  const { icon, title } = props;
  return (
    <div className="h-full w-min whitespace-nowrap flex items-center gap-2 border border-custom-border-200 hover:bg-custom-background-80 rounded px-3 py-1.5">
      {icon && icon}
      <span className="text-sm font-medium text-custom-text-300">{title}</span>
    </div>
  );
};

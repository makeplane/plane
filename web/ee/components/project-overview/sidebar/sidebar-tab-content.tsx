"use client";

import { FC, ReactNode } from "react";

type SidebarTabContentProps = {
  title: string;
  children: ReactNode;
};

export const SidebarTabContent: FC<SidebarTabContentProps> = (props) => {
  const { title, children } = props;
  return (
    <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
      <div className="flex flex-col gap-2 h-full w-full overflow-y-auto">
        {title && <h5 className="text-sm font-medium !mt-2">{title}</h5>}
        {children}
      </div>
    </div>
  );
};

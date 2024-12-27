"use client";

import { FC, ReactNode } from "react";

type SidebarTabContentProps = {
  title: string;
  children: ReactNode;
  actionElement?: ReactNode;
};

export const SidebarTabContent: FC<SidebarTabContentProps> = (props) => {
  const { title, children, actionElement } = props;
  return (
    <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
      <div className="flex flex-col gap-3 h-full w-full overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-sm font-medium">{title}</h5>
          {actionElement}
        </div>
        {children}
      </div>
    </div>
  );
};

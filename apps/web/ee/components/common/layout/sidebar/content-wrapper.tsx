"use client";

import { FC, ReactNode } from "react";

type TSidebarContentWrapperProps = {
  title?: string;
  children: ReactNode;
  actionElement?: ReactNode;
};

export const SidebarContentWrapper: FC<TSidebarContentWrapperProps> = (props) => {
  const { title, children, actionElement } = props;
  return (
    <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden px-6 pb-6">
      <div className="flex flex-col gap-3 h-full w-full overflow-y-auto">
        {(title || actionElement) && (
          <div className="flex items-center justify-between gap-2 h-7">
            {title && <h5 className="text-sm font-medium">{title}</h5>}
            {actionElement}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

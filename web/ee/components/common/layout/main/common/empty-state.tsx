"use client";

import React, { FC } from "react";

type TSectionEmptyStateProps = {
  heading: string;
  subHeading: string;
  icon: React.ReactNode;
  actionElement: React.ReactNode;
};

export const SectionEmptyState: FC<TSectionEmptyStateProps> = (props) => {
  const { heading, subHeading, icon, actionElement } = props;
  return (
    <div className="flex flex-col gap-4 items-center justify-center rounded-md border border-custom-border-200 p-10">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-8 bg-custom-background-80 rounded">{icon}</div>
        <span className="text-sm font-medium">{heading}</span>
        <span className="text-xs text-custom-text-300">{subHeading}</span>
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
};

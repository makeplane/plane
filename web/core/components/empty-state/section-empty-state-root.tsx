"use client";

import { FC } from "react";

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionElement?: React.ReactNode;
};

export const SectionEmptyState: FC<Props> = (props) => {
  const { title, description, icon, actionElement } = props;
  return (
    <div className="flex flex-col gap-4 items-center justify-center rounded-md border border-custom-border-200 p-10">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-8 bg-custom-background-80 rounded">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
        {description && <span className="text-xs text-custom-text-300">{description}</span>}
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
};

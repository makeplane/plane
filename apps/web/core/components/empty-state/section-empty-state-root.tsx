"use client";

import { FC } from "react";
import { cn } from "@plane/utils";

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionElement?: React.ReactNode;
  customClassName?: string;
};

export const SectionEmptyState: FC<Props> = (props) => {
  const { title, description, icon, actionElement, customClassName } = props;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 items-center justify-center rounded-md border border-custom-border-200 p-10",
        customClassName
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-8 bg-custom-background-80 rounded">{icon}</div>
        <span className="text-sm font-medium">{title}</span>
        {description && <span className="text-xs text-custom-text-300">{description}</span>}
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
};

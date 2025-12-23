import type { FC } from "react";
import { cn } from "@plane/utils";

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionElement?: React.ReactNode;
  customClassName?: string;
};

export function SectionEmptyState(props: Props) {
  const { title, description, icon, actionElement, customClassName } = props;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 items-center justify-center rounded-md border border-subtle p-10",
        customClassName
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-8 bg-layer-1 rounded-sm">{icon}</div>
        <span className="text-13 font-medium">{title}</span>
        {description && <span className="text-11 text-tertiary">{description}</span>}
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
}

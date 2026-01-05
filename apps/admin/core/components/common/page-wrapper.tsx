import type { ReactNode } from "react";
// plane imports
import { cn } from "@plane/utils";

type TPageWrapperProps = {
  children: ReactNode;
  header?: {
    title: string;
    description: string | ReactNode;
    actions?: ReactNode;
  };
  customHeader?: ReactNode;
  size?: "lg" | "md";
};

export const PageWrapper = (props: TPageWrapperProps) => {
  const { children, header, customHeader, size = "md" } = props;

  return (
    <div
      className={cn("mx-auto w-full h-full space-y-6 py-4", {
        "md:px-4 max-w-[1000px] 2xl:max-w-[1200px]": size === "md",
        "px-4 lg:px-12": size === "lg",
      })}
    >
      {customHeader ? (
        <div className="border-b border-subtle mx-4 py-4 space-y-1 shrink-0">{customHeader}</div>
      ) : (
        header && (
          <div className="flex items-center justify-between gap-4 border-b border-subtle mx-4 py-4 space-y-1 shrink-0">
            <div className={header.actions ? "flex flex-col gap-1" : "space-y-1"}>
              <div className="text-primary text-h5-semibold">{header.title}</div>
              <div className="text-secondary text-body-sm-regular">{header.description}</div>
            </div>
            {header.actions && <div className="shrink-0">{header.actions}</div>}
          </div>
        )
      )}
      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-sm px-4 pb-4">
        {children}
      </div>
    </div>
  );
};

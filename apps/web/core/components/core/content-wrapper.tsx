"use client";

// helpers
import { cn } from "@plane/utils";

export interface ContentWrapperProps {
  className?: string;
  children: React.ReactNode;
}

export const ContentWrapper = ({ className, children }: ContentWrapperProps) => (
  <div className="h-full w-full overflow-hidden">
    <div className={cn("relative h-full w-full overflow-x-hidden overflow-y-scroll", className)}>{children}</div>
  </div>
);

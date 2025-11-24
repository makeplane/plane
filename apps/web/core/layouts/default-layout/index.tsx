import type { ReactNode } from "react";
import { cn } from "@plane/utils";

type Props = {
  children: ReactNode;
  gradient?: boolean;
  className?: string;
};

function DefaultLayout({ children, gradient = false, className }: Props) {
  return (
    <div className={cn(`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`, className)}>
      {children}
    </div>
  );
}

export default DefaultLayout;

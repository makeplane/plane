import React from "react";
import { cn } from "../utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  noMargin?: boolean;
};

function SubHeading({ children, className, noMargin }: Props) {
  return (
    <h3 className={cn("text-18 font-medium text-secondary block leading-7", !noMargin && "mb-2", className)}>
      {children}
    </h3>
  );
}

export { SubHeading };

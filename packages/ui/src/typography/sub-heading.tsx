import React from "react";
import { cn } from "../../helpers";

type Props = {
  children: React.ReactNode;
  className?: string;
  noMargin?: boolean;
};
const SubHeading = ({ children, className, noMargin }: Props) => (
  <h3 className={cn("text-xl font-medium text-custom-text-200 block leading-7", !noMargin && "mb-2", className)}>
    {children}
  </h3>
);

export { SubHeading };

import * as React from "react";
import { cn } from "../../helpers";
import { ERowVariant, rowStyle, TRowVariant } from "./helper";

export interface CustomRowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TRowVariant;
  className?: string;
  children: React.ReactNode;
}

const CustomRow = (props: CustomRowProps) => {
  const { variant = ERowVariant.REGULAR, className = "", children, ...rest } = props;

  const style = rowStyle[variant];

  return (
    <div className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
};

CustomRow.displayName = "plane-ui-row";

export { CustomRow, ERowVariant };

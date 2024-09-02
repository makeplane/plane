import * as React from "react";
import { cn } from "../../helpers";
import { ERowVariant, rowStyle, TRowVariant } from "./helper";

export interface CustomRowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TRowVariant;
  className?: string;
  children: React.ReactNode;
}

const CustomRow = React.forwardRef<HTMLDivElement, CustomRowProps>((props, ref) => {
  const { variant = ERowVariant.REGULAR, className = "", children, ...rest } = props;

  const style = rowStyle[variant];

  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

CustomRow.displayName = "plane-ui-row";

export { CustomRow, ERowVariant };

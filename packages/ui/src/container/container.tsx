import * as React from "react";
import { cn } from "../../helpers";
import { EContainerSize, EContainerVariant, getContainerStyle, TContainerSize, TContainerVariant } from "./helper";

export interface CustomContainerProps {
  variant?: TContainerVariant;
  size?: TContainerSize;
  className?: string;
  children: React.ReactNode;
}

const CustomContainer = React.forwardRef<HTMLDivElement, CustomContainerProps>((props, ref) => {
  const { variant = EContainerVariant.outlined, className = "", size = EContainerSize.sm, children, ...rest } = props;

  const style = getContainerStyle(variant, size);
  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

CustomContainer.displayName = "plane-ui-container";

export { CustomContainer, EContainerVariant, EContainerSize };

import * as React from "react";
import { cn } from "../../helpers";
import { ECardFlow, ECardSize, ECardVariant, getCardStyle, TCardFlow, TCardSize, TCardVariant } from "./helper";

export interface CardProps {
  variant?: TCardVariant;
  size?: TCardSize;
  flow?: TCardFlow;
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    variant = ECardVariant.WITH_SHADOW,
    flow = ECardFlow.COLUMN,
    className = "",
    size = ECardSize.LG,
    children,
    ...rest
  } = props;

  const style = getCardStyle(variant, size, flow);
  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = "plane-ui-card";

export { Card, ECardVariant, ECardSize, ECardFlow };

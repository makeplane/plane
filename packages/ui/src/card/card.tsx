import * as React from "react";
import { cn } from "../../helpers";
import {
  ECardDirection,
  ECardSpacing,
  ECardVariant,
  getCardStyle,
  TCardDirection,
  TCardSpacing,
  TCardVariant,
} from "./helper";

export interface CardProps {
  variant?: TCardVariant;
  spacing?: TCardSpacing;
  direction?: TCardDirection;
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    variant = ECardVariant.WITH_SHADOW,
    direction = ECardDirection.COLUMN,
    className = "",
    spacing = ECardSpacing.LG,
    children,
    ...rest
  } = props;

  const style = getCardStyle(variant, spacing, direction);
  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = "plane-ui-card";

export { Card, ECardVariant, ECardSpacing, ECardDirection };

import * as React from "react";
// helpers
import { cn } from "../utils";
import type { TBadgeVariant, TBadgeSizes } from "./helper";
import { getIconStyling, getBadgeStyling } from "./helper";

export interface BadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TBadgeVariant;
  size?: TBadgeSizes;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  appendIcon?: any;
  prependIcon?: any;
  children: React.ReactNode;
}

const Badge = React.forwardRef(function Badge(props: BadgeProps, ref: React.ForwardedRef<HTMLButtonElement>) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    loading = false,
    disabled = false,
    prependIcon = null,
    appendIcon = null,
    children,
    ...rest
  } = props;

  const buttonStyle = getBadgeStyling(variant, size, disabled || loading);
  const buttonIconStyle = getIconStyling(size);

  return (
    <button ref={ref} type={type} className={cn(buttonStyle, className)} disabled={disabled || loading} {...rest}>
      {prependIcon && <div className={buttonIconStyle}>{React.cloneElement(prependIcon, { strokeWidth: 2 })}</div>}
      {children}
      {appendIcon && <div className={buttonIconStyle}>{React.cloneElement(appendIcon, { strokeWidth: 2 })}</div>}
    </button>
  );
});

Badge.displayName = "plane-ui-badge";

export { Badge };

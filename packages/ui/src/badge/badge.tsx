// helpers
import { cloneElement, forwardRef } from "react";
import { cn } from "../utils";
import { getIconStyling, getBadgeStyling, TBadgeVariant, TBadgeSizes } from "./helper";

export interface BadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TBadgeVariant;
  size?: TBadgeSizes;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  appendIcon?: React.ReactElement<React.ComponentProps<"svg">>;
  prependIcon?: React.ReactElement<React.ComponentProps<"svg">>;
  children: React.ReactNode;
}

const Badge = forwardRef<HTMLButtonElement, BadgeProps>((props, ref) => {
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
      {prependIcon && <div className={buttonIconStyle}>{cloneElement(prependIcon, { strokeWidth: 2 })}</div>}
      {children}
      {appendIcon && <div className={buttonIconStyle}>{cloneElement(appendIcon, { strokeWidth: 2 })}</div>}
    </button>
  );
});

Badge.displayName = "plane-ui-badge";

export { Badge };

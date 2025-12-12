import * as React from "react";
import { cn } from "../utils";
import type { BadgeProps } from "./helper";
import { getBadgeIconStyling, badgeVariants } from "./helper";

const Badge = React.forwardRef(function Badge(props: BadgeProps, ref: React.ForwardedRef<HTMLSpanElement>) {
  const { variant = "neutral", size = "base", prependIcon = null, appendIcon = null, children, ...rest } = props;

  const badgeIconStyle = getBadgeIconStyling(size ?? "base");

  return (
    <span ref={ref} className={cn(badgeVariants({ variant, size }))} {...rest}>
      {prependIcon && React.cloneElement(prependIcon, { className: cn("shrink-0", badgeIconStyle), strokeWidth: 2 })}
      {children}
      {appendIcon && React.cloneElement(appendIcon, { className: cn("shrink-0", badgeIconStyle), strokeWidth: 2 })}
    </span>
  );
});

Badge.displayName = "plane-ui-badge";

export { Badge };

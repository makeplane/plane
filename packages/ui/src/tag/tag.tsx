import * as React from "react";
import { cn } from "../utils";
import type { TTagSize, TTagVariant } from "./helper";
import { ETagSize, ETagVariant, getTagStyle } from "./helper";

export interface TagProps extends React.ComponentProps<"div"> {
  variant?: TTagVariant;
  size?: TTagSize;
  className?: string;
  children: React.ReactNode;
}

const Tag = React.forwardRef(function Tag(props: TagProps, ref: React.ForwardedRef<HTMLDivElement>) {
  const { variant = ETagVariant.OUTLINED, className = "", size = ETagSize.SM, children, ...rest } = props;

  const style = getTagStyle(variant, size);
  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

Tag.displayName = "plane-ui-container";

export { Tag, ETagVariant, ETagSize };

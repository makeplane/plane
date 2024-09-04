import * as React from "react";
import { cn } from "../../helpers";
import { ETagSize, ETagVariant, getTagStyle, TTagSize, TTagVariant } from "./helper";

export interface TagProps extends React.ComponentProps<"div"> {
  variant?: TTagVariant;
  size?: TTagSize;
  className?: string;
  children: React.ReactNode;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>((props, ref) => {
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

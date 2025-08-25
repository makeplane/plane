import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui-components/react/separator";
import clsx from "clsx";

interface SeparatorProps extends React.ComponentProps<typeof SeparatorPrimitive> {
  /**
   * The orientation of the separator
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive>, SeparatorProps>(
  ({ orientation = "horizontal", ...props }, ref) => {
    return (
      <SeparatorPrimitive
        ref={ref}
        orientation={orientation}
        data-slot="separator"
        data-orientation={orientation}
        className={clsx(
          "bg-custom-border-200",
          "shrink-0",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px"
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };

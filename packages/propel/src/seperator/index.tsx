import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui-components/react/separator";
import { cn } from "@plane/utils";

export function Separator({ className, ...props }: React.ComponentProps<typeof SeparatorPrimitive>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  );
}
  
import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { TPopoverContent } from "./types";
import { convertPlacementToSideAndAlign } from "./utils";

function PopoverContent({
  children,
  className,
  placement,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  containerRef,
  ...props
}: TPopoverContent) {
  const finalSide = placement ? convertPlacementToSideAndAlign(placement).side : side;
  const finalAlign = placement ? convertPlacementToSideAndAlign(placement).align : align;
  return (
    <PopoverPortal container={containerRef?.current}>
      <PopoverPositioner side={finalSide} sideOffset={sideOffset} align={finalAlign}>
        <BasePopover.Popup data-slot="popover-content" className={className} {...props}>
          {children}
        </BasePopover.Popup>
      </PopoverPositioner>
    </PopoverPortal>
  );
}

function Popover({ ...props }: React.ComponentProps<typeof BasePopover.Root>) {
  return <BasePopover.Root data-slot="popover" {...props} />;
}

function PopoverPortal({ ...props }: React.ComponentProps<typeof BasePopover.Portal>) {
  return <BasePopover.Portal data-slot="popover-portal" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof BasePopover.Trigger>) {
  return <BasePopover.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPositioner({ ...props }: React.ComponentProps<typeof BasePopover.Positioner>) {
  return <BasePopover.Positioner data-slot="popover-positioner" {...props} />;
}

// compound components
Popover.Button = PopoverTrigger;
Popover.Panel = PopoverContent;

export { Popover, PopoverTrigger, PopoverContent };

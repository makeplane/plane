import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { TPlacement, TSide, TAlign, convertPlacementToSideAndAlign } from "../utils/placement";

export interface PopoverContentProps extends React.ComponentProps<typeof BasePopover.Popup> {
  placement?: TPlacement;
  align?: TAlign;
  sideOffset?: BasePopover.Positioner.Props["sideOffset"];
  side?: TSide;
  containerRef?: React.RefObject<HTMLElement>;
  positionerClassName?: string;
}

// PopoverContent component
const PopoverContent = React.memo<PopoverContentProps>(function PopoverContent({
  children,
  className,
  placement,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  containerRef,
  positionerClassName,
  ...props
}) {
  // side and align calculations
  const { finalSide, finalAlign } = React.useMemo(() => {
    if (placement) {
      const converted = convertPlacementToSideAndAlign(placement);
      return { finalSide: converted.side, finalAlign: converted.align };
    }
    return { finalSide: side, finalAlign: align };
  }, [placement, side, align]);

  return (
    <PopoverPortal container={containerRef?.current}>
      <PopoverPositioner side={finalSide} sideOffset={sideOffset} align={finalAlign} className={positionerClassName}>
        <BasePopover.Popup data-slot="popover-content" className={className} {...props}>
          {children}
        </BasePopover.Popup>
      </PopoverPositioner>
    </PopoverPortal>
  );
});

// wrapper components
const PopoverTrigger = React.memo<React.ComponentProps<typeof BasePopover.Trigger>>(function PopoverTrigger(props) {
  return <BasePopover.Trigger data-slot="popover-trigger" {...props} />;
});

const PopoverPortal = React.memo<React.ComponentProps<typeof BasePopover.Portal>>(function PopoverPortal(props) {
  return <BasePopover.Portal data-slot="popover-portal" {...props} />;
});

const PopoverPositioner = React.memo<React.ComponentProps<typeof BasePopover.Positioner>>(
  function PopoverPositioner(props) {
    return <BasePopover.Positioner data-slot="popover-positioner" {...props} />;
  }
);

// compound components
const Popover = Object.assign(
  React.memo<React.ComponentProps<typeof BasePopover.Root>>(function Popover(props) {
    return <BasePopover.Root data-slot="popover" {...props} />;
  }),
  {
    Button: PopoverTrigger,
    Panel: PopoverContent,
  }
);

// display names
PopoverContent.displayName = "PopoverContent";
Popover.displayName = "Popover";
PopoverPortal.displayName = "PopoverPortal";
PopoverTrigger.displayName = "PopoverTrigger";
PopoverPositioner.displayName = "PopoverPositioner";

export { Popover };

import * as React from "react";
import { Popover as BasePopover } from "@base-ui-components/react/popover";

// types
export type Placement =
  | "auto"
  | "auto-start"
  | "auto-end"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end"
  | "top"
  | "bottom"
  | "right"
  | "left";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

export interface PopoverContentProps extends React.ComponentProps<typeof BasePopover.Popup> {
  placement?: Placement;
  align?: Align;
  sideOffset?: BasePopover.Positioner.Props["sideOffset"];
  side?: Side;
  containerRef?: React.RefObject<HTMLElement>;
}

// placement conversion map
const PLACEMENT_MAP = new Map<Placement, { side: Side; align: Align }>([
  ["auto", { side: "bottom", align: "center" }],
  ["auto-start", { side: "bottom", align: "start" }],
  ["auto-end", { side: "bottom", align: "end" }],
  ["top", { side: "top", align: "center" }],
  ["bottom", { side: "bottom", align: "center" }],
  ["left", { side: "left", align: "center" }],
  ["right", { side: "right", align: "center" }],
  ["top-start", { side: "top", align: "start" }],
  ["top-end", { side: "top", align: "end" }],
  ["bottom-start", { side: "bottom", align: "start" }],
  ["bottom-end", { side: "bottom", align: "end" }],
  ["left-start", { side: "left", align: "start" }],
  ["left-end", { side: "left", align: "end" }],
  ["right-start", { side: "right", align: "start" }],
  ["right-end", { side: "right", align: "end" }],
]);

// conversion function
export function convertPlacementToSideAndAlign(placement: Placement): {
  side: Side;
  align: Align;
} {
  return PLACEMENT_MAP.get(placement) || { side: "bottom", align: "center" };
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
      <PopoverPositioner side={finalSide} sideOffset={sideOffset} align={finalAlign}>
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

const PopoverPositioner = React.memo<React.ComponentProps<typeof BasePopover.Positioner>>(function PopoverPositioner(props) {
  return <BasePopover.Positioner data-slot="popover-positioner" {...props} />;
});

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

export { Popover};

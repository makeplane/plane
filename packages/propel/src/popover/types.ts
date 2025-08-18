import { Popover as BasePopover } from "@base-ui-components/react/popover";


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

export type TPopoverContent = React.ComponentProps<typeof BasePopover.Popup> & {
    placement?: Placement;
    align?: BasePopover.Positioner.Props["align"];
    sideOffset?: BasePopover.Positioner.Props["sideOffset"];
    side?: BasePopover.Positioner.Props["side"];
    containerRef?: React.RefObject<HTMLDivElement>;
  };
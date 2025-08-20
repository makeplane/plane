import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "@plane/utils";

export type TPosition =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "auto"
  | "auto-end"
  | "auto-start"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end"
  | "top-start"
  | "top-end";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

// placement conversion map
const PLACEMENT_MAP = new Map<TPosition, { side: Side; align: Align }>([
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

type ITooltipProps = {
  tooltipHeading?: string;
  tooltipContent: string | React.ReactNode;
  position?: TPosition;
  children: React.ReactElement;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
  side?: Side;
  align?: Align;
  sideOffset?: number;
};

// conversion function
export function convertPlacementToSideAndAlign(placement: TPosition): {
  side: Side;
  align: Align;
} {
  return PLACEMENT_MAP.get(placement) || { side: "bottom", align: "center" };
}

export function Tooltip(props: ITooltipProps) {
  const {
    tooltipHeading,
    tooltipContent,
    position = "top",
    children,
    disabled = false,
    className = "",
    openDelay = 200,
    side = "bottom",
    align = "center",
    sideOffset = 10,
    closeDelay,
    isMobile = false,
  } = props;
  const { finalSide, finalAlign } = React.useMemo(() => {
    if (position) {
      const converted = convertPlacementToSideAndAlign(position);
      return { finalSide: converted.side, finalAlign: converted.align };
    }
    return { finalSide: side, finalAlign: align };
  }, [position, side, align]);

  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root delay={openDelay} closeDelay={closeDelay} disabled={disabled}>
        <BaseTooltip.Trigger render={children} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            className={cn(
              "z-tooltip max-w-xs gap-1 overflow-hidden break-words rounded-md bg-custom-background-100 p-2 text-xs text-custom-text-200 shadow-custom-shadow-xs",
              {
                hidden: isMobile,
              },
              className
            )}
            side={finalSide}
            sideOffset={sideOffset}
            align={finalAlign}
            render={
              <BaseTooltip.Popup>
                {tooltipHeading && <h5 className="font-medium text-custom-text-100">{tooltipHeading}</h5>}
                {tooltipContent}
              </BaseTooltip.Popup>
            }
          />
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

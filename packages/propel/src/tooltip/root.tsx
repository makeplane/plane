import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "../utils";
import type { TPlacement, TSide, TAlign } from "../utils/placement";
import { convertPlacementToSideAndAlign } from "../utils/placement";

type ITooltipProps = {
  tooltipHeading?: string;
  tooltipContent?: string | React.ReactNode | null;
  position?: TPlacement;
  children: React.ReactElement;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
  side?: TSide;
  align?: TAlign;
  sideOffset?: number;
};

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
              "z-50 max-w-xs gap-1 overflow-hidden break-words rounded-lg border border-subtle-1 bg-layer-2 px-2 py-1.5 shadow-overlay-200",
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
                {tooltipHeading && <p className="text-caption-md-medium text-primary">{tooltipHeading}</p>}
                {tooltipContent && (
                  <p
                    className={cn("text-caption-sm-regular text-secondary", {
                      "mt-1": tooltipHeading && tooltipHeading !== "",
                    })}
                  >
                    {tooltipContent}
                  </p>
                )}
              </BaseTooltip.Popup>
            }
          />
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

import React from "react";

// next-themes
import { Tooltip2 } from "@blueprintjs/popover2";

export type TPosition =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "auto"
  | "auto-end"
  | "auto-start"
  | "bottom-left"
  | "bottom-right"
  | "left-bottom"
  | "left-top"
  | "right-bottom"
  | "right-top"
  | "top-left"
  | "top-right";

interface ITooltipProps {
  tooltipHeading?: string;
  tooltipContent: string | React.ReactNode;
  position?: TPosition;
  children: JSX.Element;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
}

export const Tooltip: React.FC<ITooltipProps> = ({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay,
}) => (
  <Tooltip2
    disabled={disabled}
    hoverOpenDelay={openDelay}
    hoverCloseDelay={closeDelay}
    content={
      <div
        className={`relative z-50 max-w-xs gap-1 overflow-hidden break-words rounded-md bg-custom-background-100 p-2 text-xs text-custom-text-200 shadow-md ${className}`}
      >
        {tooltipHeading && <h5 className="font-medium text-custom-text-100">{tooltipHeading}</h5>}
        {tooltipContent}
      </div>
    }
    position={position}
    renderTarget={({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isOpen: isTooltipOpen,
      ref: eleReference,
      ...tooltipProps
    }) =>
      React.cloneElement(children, {
        ref: eleReference,
        ...tooltipProps,
        ...children.props,
      })
    }
  />
);

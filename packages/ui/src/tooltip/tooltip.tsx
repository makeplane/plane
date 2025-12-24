import { Tooltip2 } from "@blueprintjs/popover2";
import React, { useEffect, useRef, useState } from "react";
// helpers
import { cn } from "../utils";

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
  children: React.ReactElement;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
}

export function Tooltip({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay,
  isMobile = false,

  //FIXME: tooltip should always render on hover and not by default, this is a temporary fix
  renderByDefault = true,
}: ITooltipProps) {
  const toolTipRef = useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] = useState(renderByDefault);

  const onHover = () => {
    setShouldRender(true);
  };

  useEffect(() => {
    const element = toolTipRef.current as any;

    if (!element) return;

    element.addEventListener("mouseenter", onHover);

    return () => {
      element?.removeEventListener("mouseenter", onHover);
    };
  }, [toolTipRef, shouldRender]);

  if (!shouldRender) {
    return (
      <div ref={toolTipRef} className="h-full flex items-center">
        {children}
      </div>
    );
  }

  return (
    <Tooltip2
      disabled={disabled}
      hoverOpenDelay={openDelay}
      hoverCloseDelay={closeDelay}
      content={
        <div
          className={cn(
            "relative block z-50 max-w-xs gap-1 overflow-hidden break-words rounded-md bg-surface-1 p-2 text-11 text-secondary shadow-md",
            {
              hidden: isMobile,
            },
            className
          )}
        >
          {tooltipHeading && <h5 className="font-medium text-primary">{tooltipHeading}</h5>}
          {tooltipContent}
        </div>
      }
      position={position}
      renderTarget={({ isOpen: isTooltipOpen, ref: eleReference, ...tooltipProps }) =>
        React.cloneElement(children, {
          ref: eleReference,
          ...tooltipProps,
          ...children.props,
        })
      }
    />
  );
}

import React, { useEffect, useRef, useState } from "react";
// helpers
import { cn } from "../../helpers";

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
  children: any;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
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
  isMobile = false,
  renderByDefault = true, //FIXME: tooltip should always render on hover and not by default, this is a temporary fix
}) => {
  const toolTipRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(renderByDefault);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onHover = () => {
    setShouldRender(true);
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, openDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelay || 0);
  };

  useEffect(() => {
    const element = toolTipRef.current as any;

    if (!element) return;

    element.addEventListener("mouseenter", onHover);

    return () => {
      element?.removeEventListener("mouseenter", onHover);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toolTipRef, shouldRender]);

  if (!shouldRender) {
    return (
      <div ref={toolTipRef} className="h-full flex items-center">
        {children}
      </div>
    );
  }

  if (disabled) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      case "top-left":
        return "bottom-full right-0 mb-2";
      case "top-right":
        return "bottom-full left-0 mb-2";
      case "bottom-left":
        return "top-full right-0 mt-2";
      case "bottom-right":
        return "top-full left-0 mt-2";
      case "left-top":
        return "right-full bottom-0 mr-2";
      case "left-bottom":
        return "right-full top-0 mr-2";
      case "right-top":
        return "left-full bottom-0 ml-2";
      case "right-bottom":
        return "left-full top-0 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div className="relative inline-block">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="inline-block">
        {React.cloneElement(children, {
          ...children.props,
        })}
      </div>

      {isOpen && !isMobile && (
        <div
          className={cn(
            "absolute z-50 max-w-xs gap-1 overflow-hidden break-words rounded-md bg-custom-background-100 p-2 text-xs text-custom-text-200 shadow-md",
            getPositionClasses(),
            className
          )}
        >
          {tooltipHeading && <h5 className="font-medium text-custom-text-100">{tooltipHeading}</h5>}
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

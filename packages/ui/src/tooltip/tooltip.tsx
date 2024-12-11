import React, { useEffect, useRef, useState } from "react";
import { Tooltip2 } from "@blueprintjs/popover2";
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
  jsxContent?: string | React.ReactNode;
  position?: TPosition;
  children: JSX.Element;
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
  jsxContent,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay,
  isMobile = false,
  renderByDefault = true, //FIXME: tooltip should always render on hover and not by default, this is a temporary fix
}: ITooltipProps) => {
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
        jsxContent ? (
          <>{jsxContent}</>
        ) : (
          <div
            className={cn(
              "relative block z-50 max-w-xs gap-1 overflow-hidden break-words rounded-md bg-custom-background-100 p-2 text-xs text-custom-text-200 shadow-md",
              {
                hidden: isMobile,
              },
              className
            )}
          >
            {tooltipHeading && <h5 className="font-medium text-custom-text-100">{tooltipHeading}</h5>}
            {tooltipContent}
          </div>
        )
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
};

import * as React from "react";

// next-themes
import { useTheme } from "next-themes";
// tooltip2
import { Tooltip2 } from "@blueprintjs/popover2";

type Props = {
  tooltipHeading?: string;
  tooltipContent: string | React.ReactNode;
  position?:
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
  children: JSX.Element;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
};

export const Tooltip: React.FC<Props> = ({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay,
}) => {
  const { theme } = useTheme();

  return (
    <Tooltip2
      disabled={disabled}
      hoverOpenDelay={openDelay}
      hoverCloseDelay={closeDelay}
      content={
        <div
          className={`relative z-50 max-w-xs gap-1 rounded-md p-2 text-xs shadow-md ${
            theme === "custom" ? "bg-custom-background-100 text-custom-text-200" : "bg-black text-gray-400"
          } overflow-hidden break-words ${className}`}
        >
          {tooltipHeading && (
            <h5 className={`font-medium ${theme === "custom" ? "text-custom-text-100" : "text-white"}`}>
              {tooltipHeading}
            </h5>
          )}
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
};

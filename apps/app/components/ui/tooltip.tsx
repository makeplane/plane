import React from "react";

import { Tooltip2 } from "@blueprintjs/popover2";

type Props = {
  tooltipHeading?: string;
  tooltipContent: string | JSX.Element;
  triangle?: boolean;
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
  theme?: "light" | "dark";
};

export const Tooltip: React.FC<Props> = ({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  theme = "light",
  triangle,
}) => (
  <Tooltip2
    disabled={disabled}
    content={
      <div
        className={`${className} relative z-50 flex max-w-[600px] flex-col items-start justify-center gap-1 rounded-md p-2 text-left text-xs shadow-md ${
          theme === "light" ? "text-custom-text-200 bg-custom-background-80" : "bg-black text-white"
        }`}
      >
        {tooltipHeading && <h5 className="font-medium">{tooltipHeading}</h5>}
        {tooltipContent}
      </div>
    }
    position={position}
    renderTarget={({ isOpen: isTooltipOpen, ref: eleReference, ...tooltipProps }) =>
      React.cloneElement(children, { ref: eleReference, ...tooltipProps, ...children.props })
    }
  />
);

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
        className={`${className} relative flex max-w-[600px] flex-col items-start justify-center gap-1 rounded-md p-2 text-left text-xs shadow-md ${
          theme === "light" ? "text-brand-muted-1 bg-brand-surface-2" : "bg-black text-white"
        }`}
      >
        <div
          className={`absolute inset-0 left-1/2 -top-1 h-3 w-3 rotate-45 bg-brand-surface-2 ${
            theme === "light" ? "text-brand-muted-1 bg-brand-surface-2" : "bg-black text-white"
          }`}
        />
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

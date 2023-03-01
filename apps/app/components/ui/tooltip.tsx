import React from "react";

import { Tooltip2 } from "@blueprintjs/popover2";

type Props = {
  tooltipHeading?: string;
  tooltipContent: string;
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
}) => (
  <Tooltip2
    disabled={disabled}
    content={
      <div
        className={`${className} flex flex-col justify-center items-start gap-1 max-w-[600px] text-xs rounded-md p-2 shadow-md text-left ${
          theme === "light" ? "bg-white text-gray-700" : "bg-black text-white"
        }`}
      >
        {tooltipHeading && <h5 className="font-medium">{tooltipHeading}</h5>}
        <p>{tooltipContent}</p>
      </div>
    }
    position={position}
    renderTarget={({ isOpen: isTooltipOpen, ref: eleRefernce, ...tooltipProps }) =>
      React.cloneElement(children, { ref: eleRefernce, ...tooltipProps, ...children.props })
    }
  />
);

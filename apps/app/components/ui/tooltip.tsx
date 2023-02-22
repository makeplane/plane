import React from "react";
import { Tooltip2 } from "@blueprintjs/popover2";

export type Props = {
  tooltipHeading?: string;
  tooltipContent: string;
  position?: "top" | "right" | "bottom" | "left";
  children: JSX.Element;
  disabled?: boolean;
};

export const Tooltip: React.FC<Props> = ({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
}) => {
  return (
    <Tooltip2
      disabled={disabled}
      content={
        <div className="flex flex-col justify-center items-start gap-1 max-w-[600px] text-xs rounded-md bg-white p-2 shadow-md capitalize text-left">
          {tooltipHeading ? (
            <>
              <h5 className="font-medium">{tooltipHeading}</h5>
              <p className="text-gray-700">{tooltipContent}</p>
            </>
          ) : (
            <p className="text-gray-700">{tooltipContent}</p>
          )}
        </div>
      }
      position={position}
      renderTarget={({ isOpen: isTooltipOpen, ref: eleRefernce, ...tooltipProps }) =>
        React.cloneElement(children, { ref: eleRefernce, ...tooltipProps, ...children.props })
      }
    />
  );
};

import React from "react";
import type { LegendProps } from "recharts";
// plane imports
import type { TChartLegend } from "@plane/types";
import { cn } from "../../utils/classname";

export const getLegendProps = (args: TChartLegend): LegendProps => {
  const { align, layout, verticalAlign } = args;
  return {
    layout,
    align,
    verticalAlign,
    wrapperStyle: {
      display: "flex",
      overflow: "hidden",
      ...(layout === "vertical"
        ? {
            top: 0,
            alignItems: "center",
            height: "100%",
          }
        : {
            left: 0,
            bottom: 0,
            width: "100%",
            justifyContent: "center",
          }),
      ...args.wrapperStyles,
    },
    content: <CustomLegend {...args} />,
  };
};

const CustomLegend = React.forwardRef(function CustomLegend(
  props: React.ComponentProps<"div"> &
    Pick<LegendProps, "payload" | "formatter" | "onClick" | "onMouseEnter" | "onMouseLeave"> &
    TChartLegend,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const { formatter, layout, onClick, onMouseEnter, onMouseLeave, payload } = props;

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn("flex items-center px-4 overflow-scroll vertical-scrollbar scrollbar-sm", {
        "max-h-full flex-col items-start py-4": layout === "vertical",
      })}
    >
      {payload.map((item, index) => (
        <div
          key={item.value}
          className={cn("flex items-center gap-1.5 text-tertiary text-13 font-medium whitespace-nowrap", {
            "px-2": layout === "horizontal",
            "py-2": layout === "vertical",
            "pl-0 pt-0": index === 0,
            "pr-0 pb-0": index === payload.length - 1,
            "cursor-pointer": !!props.onClick,
          })}
          onClick={(e) => onClick?.(item, index, e)}
          onMouseEnter={(e) => onMouseEnter?.(item, index, e)}
          onMouseLeave={(e) => onMouseLeave?.(item, index, e)}
        >
          <div
            className="flex-shrink-0 size-2 rounded-xs"
            style={{
              backgroundColor: item.color,
            }}
          />
          {/* @ts-expect-error recharts types are not up to date */}
          {formatter?.(item.value, { value: item.value }, index) ?? item.payload?.name}
        </div>
      ))}
    </div>
  );
});
CustomLegend.displayName = "CustomLegend";

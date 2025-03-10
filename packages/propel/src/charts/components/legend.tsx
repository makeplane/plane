import React from "react";
import { LegendProps } from "recharts";
// plane imports
import { TChartLegend } from "@plane/types";
import { cn } from "@plane/utils";

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
    },
    content: <CustomLegend {...args} />,
  };
};

const CustomLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & Pick<LegendProps, "payload" | "formatter"> & TChartLegend
>((props, ref) => {
  const { formatter, layout, payload } = props;

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-4 px-4 overflow-scroll vertical-scrollbar scrollbar-sm", {
        "max-h-full flex-col items-start py-4": layout === "vertical",
      })}
    >
      {payload.map((item, index) => (
        // @ts-expect-error recharts types are not up to date
        <div key={item.payload?.key} className="flex items-center gap-1.5 text-custom-text-300 text-sm font-medium">
          <div
            className="flex-shrink-0 size-2 rounded-sm"
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

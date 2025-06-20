import * as React from "react";
import { GanttChartSquare, LayoutGrid, List } from "lucide-react";
import { TModuleLayoutOptions } from "@plane/types";
import { cn } from "@plane/utils";

interface ILayoutIcon {
  className?: string;
  containerClassName?: string;
  layoutType: TModuleLayoutOptions;
  size?: number;
  withContainer?: boolean;
}

export const ModuleLayoutIcon: React.FC<ILayoutIcon> = (props) => {
  const { layoutType, className = "", containerClassName = "", size = 14, withContainer = false } = props;

  // get Layout icon
  const icons = {
    list: List,
    board: LayoutGrid,
    gantt: GanttChartSquare,
  };
  const Icon = icons[layoutType ?? "list"];

  if (!Icon) return null;

  return (
    <>
      {withContainer ? (
        <div className={cn("flex items-center justify-center border rounded p-0.5 flex-shrink-0", containerClassName)}>
          <Icon size={size} className={cn(className)} />
        </div>
      ) : (
        <Icon size={size} className={cn("flex-shrink-0", className)} />
      )}
    </>
  );
};

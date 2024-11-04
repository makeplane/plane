import { useState } from "react";
import { observer } from "mobx-react";
// Plane
import { cn } from "@plane/editor";
//helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
//hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type RightResizableProps = {
  enableBlockRightResize: boolean;
  handleBlockDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragDirection: "left" | "right" | "move") => void;
  isMoving: "left" | "right" | "move" | undefined;
  position?: {
    marginLeft: number;
    width: number;
  };
};
export const RightResizable = observer((props: RightResizableProps) => {
  const { enableBlockRightResize, handleBlockDrag, isMoving, position } = props;
  const [isHovering, setIsHovering] = useState(false);

  const { getDateFromPositionOnGantt } = useTimeLineChartStore();

  const date = position ? getDateFromPositionOnGantt(position.marginLeft + position.width, -1) : undefined;
  const dateString = date ? renderFormattedDate(date) : undefined;

  const isRightResizing = isMoving === "right" || isMoving === "move";

  if (!enableBlockRightResize) return null;

  return (
    <>
      {(isHovering || isRightResizing) && dateString && (
        <div className="z-[10] absolute flex text-xs font-normal text-custom-text-300 h-full w-32 -right-36 justify-start items-center">
          <div className="px-2 py-1 bg-custom-primary-20 rounded">{dateString}</div>
        </div>
      )}
      <div
        onMouseDown={(e) => handleBlockDrag(e, "right")}
        onMouseOver={() => {
          setIsHovering(true);
        }}
        onMouseOut={() => {
          setIsHovering(false);
        }}
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-[6] h-full w-3 cursor-col-resize rounded-md"
      />
      <div
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-1 z-[5] rounded-sm bg-custom-background-100 transition-all duration-300 opacity-0 group-hover:opacity-100",
          {
            "-right-1.5 opacity-100": isRightResizing,
          }
        )}
      />
    </>
  );
});

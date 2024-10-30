import { observer } from "mobx-react";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { getSVGPoints } from "./utils";

export const TimelineDraggablePath = observer(() => {
  const { isDependencyEnabled, dependencyDraggingDetails } = useTimeLineChartStore();

  if (!dependencyDraggingDetails || !isDependencyEnabled) return <></>;

  const { startPosition, dragPosition, draggedFromPosition, draggedOnPosition } = dependencyDraggingDetails;

  const { pathStart, pathEnd, cp1, cp2, viewBox, width, height } = getSVGPoints(
    startPosition,
    dragPosition,
    draggedFromPosition,
    draggedOnPosition
  );

  return (
    <div
      className="absolute left-0 top-0 z-[6] pointer-events-none"
      style={{
        transform: `translate(${startPosition.x + viewBox.minX}px, ${startPosition.y + viewBox.minY}px)`,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`${viewBox.minX} ${viewBox.minY} ${width} ${height}`}
        width={width}
        height={height}
      >
        <g>
          <path
            d={`M${pathStart.x},${pathStart.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${pathEnd.x - 1},${pathEnd.y} `}
            stroke={"#3f76ff"}
            stroke-width={`1.5`}
            fill="none"
            markerEnd={`url(#arrowhead)`}
          />
        </g>
        <defs>
          <marker markerWidth="7" markerHeight="7" refX="4" refY="2.5" viewBox="0 0 5 5" orient="auto" id={`arrowhead`}>
            <polygon points="0,5 1.6666666666666667,2.5 0,0 5,2.5" fill={"#3f76ff"}></polygon>
          </marker>
        </defs>
      </svg>
    </div>
  );
});

import { observer } from "mobx-react";
import { Relation } from "@/plane-web/types";
import { getSVGPoints } from "./utils";

const strokeWidth = 10;

type TimelineDependencyPathItemProps = {
  relation: Relation;
  onPathClick: (relation: Relation) => void;
};

export const TimelineDependencyPathItem = observer((props: TimelineDependencyPathItemProps) => {
  const { relation, onPathClick } = props;

  const { id, originDependencyPosition, destinationDependencyPosition, isAdhering, startPosition, endPosition } =
    relation;

  const { viewBox, width, height, path } = getSVGPoints(
    startPosition,
    endPosition,
    originDependencyPosition,
    destinationDependencyPosition
  );

  const strokeColor = isAdhering ? "#3f76ff" : "#dc3e3e";

  return (
    <div
      className="absolute left-0 top-0 z-[4] pointer-events-none"
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
        <g className="cursor-pointer pointer-events-auto" onClick={() => onPathClick(relation)}>
          <path
            className="opacity-0 hover:opacity-5"
            d={path}
            stroke={"#3F76FF"}
            stroke-width={`${strokeWidth}`}
            fill="none"
          />
          <path d={path} stroke={strokeColor} stroke-width={`1.5`} fill="none" marker-end={`url(#arrowhead-${id})`} />
        </g>
        <defs>
          <marker
            markerWidth="7"
            markerHeight="7"
            refX="4"
            refY="2.5"
            viewBox="0 0 5 5"
            orient="auto"
            id={`arrowhead-${id}`}
          >
            <polygon points="0,5 1.6666666666666667,2.5 0,0 5,2.5" fill={strokeColor} />
          </marker>
        </defs>
      </svg>
    </div>
  );
});

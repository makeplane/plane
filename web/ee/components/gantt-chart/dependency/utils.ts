import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { EDependencyPosition } from "@/plane-web/constants";

const minControlX = 50;
const maxControlX = 250;
const strokeWidth = 10;

export const getIndicatorBasedOnDependency = (
  dependencyPosition: EDependencyPosition | undefined,
  defaultValue: 1 | -1 = 1
) => {
  switch (dependencyPosition) {
    case EDependencyPosition.START:
      return -1;
    case EDependencyPosition.END:
      return 1;
    default:
      return defaultValue;
  }
};

/**
 * return all the points in SVG to draw Bezier curve
 * @param startPosition
 * @param endPosition
 * @param originDependencyPosition
 * @param destinationDependencyPosition
 * @returns
 */
export const getSVGPoints = (
  startPosition: { x: number; y: number },
  endPosition: { x: number; y: number },
  originDependencyPosition: EDependencyPosition,
  destinationDependencyPosition?: EDependencyPosition
) => {
  const { x: startX, y: startY } = startPosition;
  const { x: endX, y: endY } = endPosition;

  const originIndicator = getIndicatorBasedOnDependency(originDependencyPosition);
  const destinationIndicator = getIndicatorBasedOnDependency(destinationDependencyPosition, -1);

  // calculate path start and end dates
  const pathStartX = 0,
    pathStartY = 0,
    pathEndX = endX - startX,
    pathEndY = endY - startY;

  // Calculation of control length, based on which the curvature of the line is determined
  const horizontalDistance = Math.abs(startX - endX);
  const verticalDistance = Math.abs(startY - endY);
  const diagonalDistance = Math.sqrt(Math.pow(horizontalDistance, 2) + Math.pow(verticalDistance, 2));
  const approxControlDistance = Math.round(diagonalDistance / 15);
  const controlLengthX = Math.min(Math.max(approxControlDistance, minControlX), maxControlX);

  // calculate the control points of the bezier line
  const controlStartX = pathStartX + controlLengthX * originIndicator,
    controlStartY = pathStartY,
    controlEndX = pathEndX + controlLengthX * destinationIndicator,
    controlEndY = pathEndY;

  // calculate the viewBox of the SVG
  const viewBoxMinX = Math.min(pathStartX, controlStartX, controlEndX, pathEndX),
    viewBoxMinY = Math.min(pathStartY, controlStartY, controlEndY, pathEndY) - strokeWidth / 2,
    viewBoxMaxX = Math.max(pathStartX, controlStartX, controlEndX, pathEndX),
    viewBoxMaxY = Math.max(pathStartY, controlStartY, controlEndY, pathEndY) - strokeWidth / 2;

  let path;
  if (originIndicator !== destinationIndicator) {
    // For lines that has to reach a position other than it's own, like start to end or end to start
    const midX = (controlStartX + controlEndX) / 2;
    const midY = (controlStartY + controlEndY) / 2;

    if ((controlStartX - controlEndX) * originIndicator < 0) {
      // For line which has to go forward and doesn't have to curve drastically eg start point is before end point
      path = `M${pathStartX},${pathStartY} C${midX},${pathStartY} ${midX},${pathEndY} ${pathEndX},${pathEndY} `;
    } else {
      // for lines that has to curve drastically eg start point is after end point
      const controlHeight = Math.min(Math.abs(pathStartY - pathEndY), BLOCK_HEIGHT / 2);
      const controlY1 = controlStartY < midY ? controlStartY + controlHeight : controlStartY - controlHeight,
        controlY2 = controlEndY < midY ? controlEndY + controlHeight : controlEndY - controlHeight;
      path = `M${pathStartX},${pathStartY} C${controlStartX},${controlStartY} ${controlStartX},${controlY1} ${midX},${midY} C${controlEndX},${controlY2} ${controlEndX},${controlEndY} ${pathEndX},${pathEndY} `;
    }
  } else {
    // For lines that has same start and end positions, like start to start or end to end
    const controlX = originIndicator * Math.max(controlStartX * originIndicator, controlEndX * originIndicator);
    path = `M${pathStartX},${pathStartY} C${controlX},${controlStartY} ${controlX},${controlEndY} ${pathEndX},${pathEndY} `;
  }
  // Height and width of the view box
  const width = viewBoxMaxX - viewBoxMinX,
    height = viewBoxMaxY - viewBoxMinY + strokeWidth;

  return {
    path,
    viewBox: {
      minX: viewBoxMinX,
      minY: viewBoxMinY,
      maxX: viewBoxMaxX,
      maxY: viewBoxMaxY,
    },
    width,
    height,
  };
};

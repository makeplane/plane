import { EDependencyPosition } from "@/plane-web/constants";

const minControlX = 50;
const maxControlX = 500;
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
  const approxControlDistance = Math.round(diagonalDistance / 4);
  const controlLengthX = Math.min(Math.max(approxControlDistance, minControlX), maxControlX);

  // calculate the control points of the bezier line
  const controlPointX1 = pathStartX + controlLengthX * originIndicator,
    controlPointY1 = pathStartY,
    controlPointX2 = pathEndX + controlLengthX * destinationIndicator,
    controlPointY2 = pathEndY;

  // calculate the viewBox of the SVG
  const viewBoxMinX = Math.min(pathStartX, controlPointX1, controlPointX2, pathEndX),
    viewBoxMinY = Math.min(pathStartY, controlPointY1, controlPointY2, pathEndY) - strokeWidth / 2,
    viewBoxMaxX = Math.max(pathStartX, controlPointX1, controlPointX2, pathEndX),
    viewBoxMaxY = Math.max(pathStartY, controlPointY1, controlPointY2, pathEndY) - strokeWidth / 2;

  // Height and width of the view box
  const width = viewBoxMaxX - viewBoxMinX,
    height = viewBoxMaxY - viewBoxMinY + strokeWidth;

  return {
    pathStart: { x: pathStartX, y: pathStartY },
    pathEnd: { x: pathEndX, y: pathEndY },
    cp1: { x: controlPointX1, y: controlPointY1 },
    cp2: { x: controlPointX2, y: controlPointY2 },
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

// plane web constants
import { EEstimateSystem } from "@plane/constants";

export const isEstimatePointValuesRepeated = (
  estimatePoints: string[],
  estimateType: EEstimateSystem,
  newEstimatePoint?: string
) => {
  const currentEstimatePoints = estimatePoints.map((estimatePoint) => estimatePoint.trim());
  let isRepeated = false;

  if (newEstimatePoint === undefined) {
    if (estimateType === EEstimateSystem.CATEGORIES) {
      const points = new Set(currentEstimatePoints);
      if (points.size != currentEstimatePoints.length) isRepeated = true;
    } else if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)) {
      currentEstimatePoints.map((point) => {
        if (Number(point) === Number(newEstimatePoint)) isRepeated = true;
      });
    }
  } else {
    if (estimateType === EEstimateSystem.CATEGORIES) {
      currentEstimatePoints.map((point) => {
        if (point === newEstimatePoint.trim()) isRepeated = true;
      });
    } else if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)) {
      currentEstimatePoints.map((point) => {
        if (Number(point) === Number(newEstimatePoint.trim())) isRepeated = true;
      });
    }
  }

  return isRepeated;
};

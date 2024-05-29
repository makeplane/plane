import { EEstimateSystem } from "@plane/types/src/enums";

export const isEstimatePointValuesRepeated = (
  estimatePoints: string[],
  estimateType: EEstimateSystem,
  newEstimatePoint?: string | undefined
) => {
  const currentEstimatePoints = estimatePoints.map((estimatePoint) => estimatePoint.trim());
  let isValid = false;

  if (newEstimatePoint === undefined) {
    if (estimateType === EEstimateSystem.CATEGORIES) {
      const points = new Set(currentEstimatePoints);
      if (points.size === currentEstimatePoints.length) isValid = true;
    } else if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)) {
      currentEstimatePoints.map((point) => {
        if (Number(point) === Number(newEstimatePoint)) isValid = true;
      });
    }
  } else {
    if (estimateType === EEstimateSystem.CATEGORIES) {
      currentEstimatePoints.map((point) => {
        if (point === newEstimatePoint.trim()) isValid = true;
      });
    } else if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)) {
      currentEstimatePoints.map((point) => {
        if (Number(point) === Number(newEstimatePoint.trim())) isValid = true;
      });
    }
  }

  return isValid;
};

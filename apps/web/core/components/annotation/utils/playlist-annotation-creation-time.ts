import type { TCustomPlaylistAnnotation } from "../types/annotation.types";

export const VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS = 1;

const normalizeCreationTime = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
};

export const getAnnotationStartTimeWithCreationOffset = (playheadTime: number) =>
  Math.max(0, normalizeCreationTime(playheadTime) - VIDEO_ANNOTATION_START_TIME_OFFSET_SECONDS);

export const applyAnnotationCreationStartTimeOffset = (
  annotation: TCustomPlaylistAnnotation
): TCustomPlaylistAnnotation => {
  const annotationDurationSeconds = Math.max(
    0,
    normalizeCreationTime(annotation.endTime) - normalizeCreationTime(annotation.startTime)
  );
  const startTime = getAnnotationStartTimeWithCreationOffset(annotation.startTime);

  return {
    ...annotation,
    endTime: startTime + annotationDurationSeconds,
    startTime,
  };
};

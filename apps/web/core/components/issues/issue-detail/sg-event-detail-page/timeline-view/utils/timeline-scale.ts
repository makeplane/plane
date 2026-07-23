export const BASE_TIMELINE_WIDTH_PX = 1400;
export const MIN_TIMELINE_WIDTH_PX = 760;
export const MIN_TIMELINE_MAJOR_TICK_SPACING_PX = 72;
export const MIN_TIMELINE_MINOR_TICK_SPACING_PX = 12;
export const MIN_SECOND_TICK_SPACING_PX = 56;
export const SECOND_LEVEL_TIMELINE_SCALE = 64;
export const DEFAULT_TIMELINE_TAG_DURATION_SECONDS = 8;
export const TIMELINE_SCALE_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 8, 16, 32, 64] as const;
export const DEFAULT_TIMELINE_SCALE_INDEX = 2;
const TIMELINE_NICE_INTERVAL_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400] as const;

export type TimelineScaleDirection = "in" | "out";
export type TimelineTickKind = "major" | "minor";

export type TimelineTick = {
  kind: TimelineTickKind;
  label: string;
  position: number;
  seconds: number;
};

export const getClampedTimelineScaleIndex = (index: number) =>
  Math.min(Math.max(index, 0), TIMELINE_SCALE_LEVELS.length - 1);

export const getNextTimelineScaleIndex = (currentIndex: number, direction: TimelineScaleDirection) =>
  getClampedTimelineScaleIndex(currentIndex + (direction === "in" ? 1 : -1));

export const getTimelineScaleIndexFromSliderValue = (value: number | string, fallbackIndex: number) => {
  const parsedIndex = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsedIndex) ? getClampedTimelineScaleIndex(Math.round(parsedIndex)) : fallbackIndex;
};

export const getTimelineContentWidth = (scale: number, totalSeconds = 0) => {
  const scaledBaseWidth = Math.round(BASE_TIMELINE_WIDTH_PX * scale);
  const secondLevelWidth =
    scale >= SECOND_LEVEL_TIMELINE_SCALE ? Math.ceil(Math.max(1, totalSeconds) * MIN_SECOND_TICK_SPACING_PX) : 0;

  return Math.max(MIN_TIMELINE_WIDTH_PX, scaledBaseWidth, secondLevelWidth);
};

export const getTimelineScaleLabel = (scale: number) =>
  scale >= SECOND_LEVEL_TIMELINE_SCALE ? "1 sec" : `${Math.round(scale * 100)}%`;

export const getTimelinePositionPercent = (seconds: number, totalSeconds: number) => {
  const safeTotalSeconds = Math.max(1, totalSeconds || 0);
  const rawPosition = (seconds * 100) / safeTotalSeconds;

  return Math.min(Math.max(rawPosition, 0), 100);
};

export const getTimelinePixelsPerSecond = (contentWidthPx: number, totalSeconds: number) =>
  Math.max(0, contentWidthPx) / Math.max(1, totalSeconds || 0);

export const getTimelineTimePixel = (seconds: number, totalSeconds: number, contentWidthPx: number) => {
  const safeTotalSeconds = Math.max(1, totalSeconds || 0);
  const clampedSeconds = Math.min(Math.max(seconds || 0, 0), safeTotalSeconds);

  return clampedSeconds * getTimelinePixelsPerSecond(contentWidthPx, safeTotalSeconds);
};

export const getTimelineSecondsFromClientX = ({
  clientX,
  contentWidthPx,
  scrollLeftPx,
  seekableSeconds,
  totalSeconds,
  viewportLeftPx,
}: {
  clientX: number;
  contentWidthPx: number;
  scrollLeftPx: number;
  seekableSeconds?: number | null;
  totalSeconds: number;
  viewportLeftPx: number;
}) => {
  const safeContentWidthPx = Math.max(1, contentWidthPx || 0);
  const safeTotalSeconds = Math.max(1, totalSeconds || 0);
  const safeScrollLeftPx = Math.max(0, scrollLeftPx || 0);
  const safeSeekableSeconds =
    typeof seekableSeconds === "number" && Number.isFinite(seekableSeconds) && seekableSeconds >= 0
      ? seekableSeconds
      : safeTotalSeconds;
  const timelinePositionPx = clientX - viewportLeftPx + safeScrollLeftPx;
  const clampedPositionPx = Math.min(Math.max(timelinePositionPx, 0), safeContentWidthPx);
  const timelineSeconds = (clampedPositionPx / safeContentWidthPx) * safeTotalSeconds;

  return Math.min(Math.max(timelineSeconds, 0), safeSeekableSeconds);
};

export const getTimelineRangePixels = ({
  contentWidthPx,
  endSeconds,
  minWidthPx = 4,
  startSeconds,
  totalSeconds,
}: {
  contentWidthPx: number;
  endSeconds: number | null;
  minWidthPx?: number;
  startSeconds: number;
  totalSeconds: number;
}) => {
  const leftPx = getTimelineTimePixel(startSeconds, totalSeconds, contentWidthPx);
  const rightPx =
    endSeconds !== null && endSeconds > startSeconds
      ? getTimelineTimePixel(endSeconds, totalSeconds, contentWidthPx)
      : leftPx + minWidthPx;

  return {
    leftPx,
    widthPx: Math.max(minWidthPx, rightPx - leftPx),
  };
};

const getPositiveFiniteSeconds = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

export const getTimelineTagDurationSeconds = ({
  clipDurationSeconds,
  explicitEndSeconds,
  fallbackDurationSeconds = DEFAULT_TIMELINE_TAG_DURATION_SECONDS,
  startSeconds,
}: {
  clipDurationSeconds: number | null;
  explicitEndSeconds: number | null;
  fallbackDurationSeconds?: number;
  startSeconds: number;
}) => {
  const actualClipDurationSeconds = getPositiveFiniteSeconds(clipDurationSeconds);
  if (actualClipDurationSeconds !== null) return actualClipDurationSeconds;

  if (explicitEndSeconds !== null && explicitEndSeconds > startSeconds) {
    return explicitEndSeconds - startSeconds;
  }

  return getPositiveFiniteSeconds(fallbackDurationSeconds) ?? DEFAULT_TIMELINE_TAG_DURATION_SECONDS;
};

export const getTimelineTagEndSeconds = ({
  clipDurationSeconds,
  explicitEndSeconds,
  fallbackDurationSeconds,
  startSeconds,
}: {
  clipDurationSeconds: number | null;
  explicitEndSeconds: number | null;
  fallbackDurationSeconds?: number;
  startSeconds: number;
}) =>
  startSeconds +
  getTimelineTagDurationSeconds({
    clipDurationSeconds,
    explicitEndSeconds,
    fallbackDurationSeconds,
    startSeconds,
  });

export const getTimelinePlaybackSeconds = ({
  activeClipStartSeconds,
  isClipPlaybackActive,
  playheadSeconds,
}: {
  activeClipStartSeconds: number | null;
  isClipPlaybackActive: boolean;
  playheadSeconds: number;
}) =>
  Math.max(0, (isClipPlaybackActive && activeClipStartSeconds !== null ? activeClipStartSeconds : 0) + playheadSeconds);

export const isTimelineTagPlaybackOverrideId = (playbackOverrideId: string | null) =>
  playbackOverrideId?.startsWith("sg-tag-") ?? false;

export const getTimelinePanelInputPlayheadSeconds = ({
  playbackOverrideId,
  playheadBaseSeconds,
  playerLocalSeconds,
}: {
  playbackOverrideId: string | null;
  playheadBaseSeconds: number;
  playerLocalSeconds: number;
}) => Math.max(0, (playbackOverrideId === null ? playheadBaseSeconds : 0) + playerLocalSeconds);

const getNiceTimelineIntervalSeconds = (minimumSeconds: number) => {
  const safeMinimumSeconds = Math.max(1, Math.ceil(minimumSeconds || 0));
  const matchingInterval = TIMELINE_NICE_INTERVAL_SECONDS.find(
    (intervalSeconds) => intervalSeconds >= safeMinimumSeconds
  );

  if (matchingInterval) return matchingInterval;

  const largestInterval = TIMELINE_NICE_INTERVAL_SECONDS.at(-1) ?? 14400;
  return Math.ceil(safeMinimumSeconds / largestInterval) * largestInterval;
};

const getTimelineMajorTickStepSeconds = (totalSeconds: number, scale: number, contentWidthPx: number) => {
  const safeScale = Math.max(scale, TIMELINE_SCALE_LEVELS[0]);
  const safeTotalSeconds = Math.max(1, Math.ceil(totalSeconds || 0));
  const safeContentWidthPx = Math.max(1, contentWidthPx || getTimelineContentWidth(safeScale, safeTotalSeconds));
  const pixelsPerSecond = getTimelinePixelsPerSecond(safeContentWidthPx, safeTotalSeconds);
  const minimumMajorStepSeconds = MIN_TIMELINE_MAJOR_TICK_SPACING_PX / Math.max(pixelsPerSecond, 0.0001);

  return getNiceTimelineIntervalSeconds(minimumMajorStepSeconds);
};

export const buildScaledTickStepSeconds = (totalSeconds: number, scale: number, contentWidthPx?: number) =>
  getTimelineMajorTickStepSeconds(totalSeconds, scale, contentWidthPx ?? getTimelineContentWidth(scale, totalSeconds));

export const formatTimelineTickLabel = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getTimelineMinorTickStepSeconds = (majorStepSeconds: number, pixelsPerSecond: number) => {
  const minorStepCandidates = TIMELINE_NICE_INTERVAL_SECONDS.filter(
    (intervalSeconds) => intervalSeconds < majorStepSeconds && majorStepSeconds % intervalSeconds === 0
  );

  return (
    minorStepCandidates.find(
      (intervalSeconds) => intervalSeconds * pixelsPerSecond >= MIN_TIMELINE_MINOR_TICK_SPACING_PX
    ) ?? null
  );
};

export const buildScaledTimelineTicks = (
  totalSeconds: number,
  scale: number,
  contentWidthPx?: number
): TimelineTick[] => {
  const safeTotalSeconds = Math.max(1, Math.ceil(totalSeconds || 0));
  const safeContentWidthPx = Math.max(1, contentWidthPx ?? getTimelineContentWidth(scale, safeTotalSeconds));
  const pixelsPerSecond = getTimelinePixelsPerSecond(safeContentWidthPx, safeTotalSeconds);
  const majorStepSeconds = buildScaledTickStepSeconds(safeTotalSeconds, scale, safeContentWidthPx);
  const minorStepSeconds = getTimelineMinorTickStepSeconds(majorStepSeconds, pixelsPerSecond);
  const majorSeconds = new Set<number>();
  const minorSeconds = new Set<number>();

  for (let tickSeconds = 0; tickSeconds <= safeTotalSeconds; tickSeconds += majorStepSeconds) {
    majorSeconds.add(tickSeconds);
  }

  if (minorStepSeconds !== null) {
    for (let tickSeconds = minorStepSeconds; tickSeconds <= safeTotalSeconds; tickSeconds += minorStepSeconds) {
      if (!majorSeconds.has(tickSeconds)) {
        minorSeconds.add(tickSeconds);
      }
    }
  }

  if (!majorSeconds.has(safeTotalSeconds)) {
    const previousMajorSeconds = Math.floor(safeTotalSeconds / majorStepSeconds) * majorStepSeconds;
    const endLabelSpacingPx = (safeTotalSeconds - previousMajorSeconds) * pixelsPerSecond;

    if (endLabelSpacingPx >= MIN_TIMELINE_MAJOR_TICK_SPACING_PX) {
      majorSeconds.add(safeTotalSeconds);
    } else {
      minorSeconds.add(safeTotalSeconds);
    }
  }

  return [
    ...Array.from(majorSeconds, (seconds) => ({
      kind: "major" as const,
      label: formatTimelineTickLabel(seconds),
      position: (seconds * 100) / safeTotalSeconds,
      seconds,
    })),
    ...Array.from(minorSeconds, (seconds) => ({
      kind: "minor" as const,
      label: "",
      position: (seconds * 100) / safeTotalSeconds,
      seconds,
    })),
  ].sort((leftTick, rightTick) => leftTick.seconds - rightTick.seconds);
};

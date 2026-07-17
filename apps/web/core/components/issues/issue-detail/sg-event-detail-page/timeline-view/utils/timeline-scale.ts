export const BASE_TIMELINE_WIDTH_PX = 1400;
export const MIN_TIMELINE_WIDTH_PX = 760;
export const MIN_SECOND_TICK_SPACING_PX = 56;
export const SECOND_LEVEL_TIMELINE_SCALE = 64;
export const DEFAULT_TIMELINE_TAG_DURATION_SECONDS = 8;
export const TIMELINE_SCALE_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 8, 16, 32, 64] as const;
export const DEFAULT_TIMELINE_SCALE_INDEX = 2;

export type TimelineScaleDirection = "in" | "out";

export type TimelineTick = {
  label: string;
  position: number;
};

export const getClampedTimelineScaleIndex = (index: number) =>
  Math.min(Math.max(index, 0), TIMELINE_SCALE_LEVELS.length - 1);

export const getNextTimelineScaleIndex = (currentIndex: number, direction: TimelineScaleDirection) =>
  getClampedTimelineScaleIndex(currentIndex + (direction === "in" ? 1 : -1));

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

const buildTickStepSeconds = (totalSeconds: number) => {
  if (totalSeconds <= 60) return 5;
  if (totalSeconds <= 180) return 10;
  if (totalSeconds <= 600) return 30;
  if (totalSeconds <= 1800) return 60;
  if (totalSeconds <= 5400) return 300;
  return 600;
};

export const buildScaledTickStepSeconds = (totalSeconds: number, scale: number) => {
  const safeScale = Math.max(scale, TIMELINE_SCALE_LEVELS[0]);
  if (safeScale >= SECOND_LEVEL_TIMELINE_SCALE) return 1;

  return buildTickStepSeconds(Math.max(1, totalSeconds / safeScale));
};

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

export const buildScaledTimelineTicks = (totalSeconds: number, scale: number): TimelineTick[] => {
  const safeTotalSeconds = Math.max(1, Math.ceil(totalSeconds || 0));
  const tickStepSeconds = buildScaledTickStepSeconds(safeTotalSeconds, scale);
  const ticks = Array.from({ length: Math.floor(safeTotalSeconds / tickStepSeconds) + 1 }, (_, index) => {
    const tickSeconds = index * tickStepSeconds;

    return {
      label: formatTimelineTickLabel(tickSeconds),
      position: (tickSeconds * 100) / safeTotalSeconds,
    };
  });

  if (ticks.at(-1)?.position === 100) return ticks;

  return [
    ...ticks,
    {
      label: formatTimelineTickLabel(safeTotalSeconds),
      position: 100,
    },
  ];
};

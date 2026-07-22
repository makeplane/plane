export const TIMELINE_PANEL_MIN_HEIGHT_PX = 240;
export const TIMELINE_PANEL_VIEWPORT_PADDING_PX = 12;
export const TIMELINE_SPLIT_MAX_EXPANSION_PX = 360;
export const TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX = 280;
export const TIMELINE_UPPER_CONTENT_SCALE_MIN = 0.3;
export const TIMELINE_WHEEL_DELTA_CAP_PX = 16;

export const TIMELINE_PANEL_ROOT_CLASS = "flex min-h-0 flex-col overflow-hidden overscroll-contain";

export const TIMELINE_TRACKS_SCROLL_CLASS =
  "sg-event-timeline-scrollbar vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]";

export const TIMELINE_TRACKS_ROW_CLASS = "flex min-w-0";

export const TIMELINE_LANE_LABEL_COLUMN_CLASS = "w-[220px] shrink-0 border-r border-custom-border-200";

export const TIMELINE_HORIZONTAL_SCROLL_CLASS = "min-w-0 flex-1 overflow-x-hidden overflow-y-hidden";

export const TIMELINE_FIXED_FOOTER_CLASS = "shrink-0 overflow-hidden bg-custom-background-100 [contain:layout_paint]";

export const TIMELINE_RULER_SCROLL_CLASS =
  "sg-event-timeline-scrollbar horizontal-scrollbar scrollbar-md h-10 min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-gutter:stable]";

export const TIMELINE_UPPER_CONTENT_SCALE_CLASS = "min-w-0 origin-top-left will-change-transform";

type TimelinePanelMaxHeightArgs = {
  minHeightPx?: number;
  panelTopPx: number;
  viewportHeightPx: number;
  viewportPaddingPx?: number;
};

export const getTimelinePanelMaxHeightPx = ({
  minHeightPx = TIMELINE_PANEL_MIN_HEIGHT_PX,
  panelTopPx,
  viewportHeightPx,
  viewportPaddingPx = TIMELINE_PANEL_VIEWPORT_PADDING_PX,
}: TimelinePanelMaxHeightArgs) => {
  const availableHeight = Math.floor(viewportHeightPx - Math.max(0, panelTopPx) - viewportPaddingPx);

  return Math.max(minHeightPx, availableHeight);
};

type TimelineSplitMaxExpansionArgs = {
  maxExpansionPx?: number;
  upperLayoutHeightPx: number;
  upperMinHeightPx?: number;
};

const clampTimelineValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type TimelineUpperContentScaleArgs = {
  minScale?: number;
  upperDefaultHeightPx: number | null;
  upperLayoutHeightPx: number | null;
};

export const getTimelineUpperContentScale = ({
  minScale = TIMELINE_UPPER_CONTENT_SCALE_MIN,
  upperDefaultHeightPx,
  upperLayoutHeightPx,
}: TimelineUpperContentScaleArgs) => {
  if (
    upperDefaultHeightPx === null ||
    upperLayoutHeightPx === null ||
    !Number.isFinite(upperDefaultHeightPx) ||
    !Number.isFinite(upperLayoutHeightPx) ||
    upperDefaultHeightPx <= 0 ||
    upperLayoutHeightPx <= 0
  ) {
    return 1;
  }

  if (upperLayoutHeightPx >= upperDefaultHeightPx) return 1;

  return clampTimelineValue(upperLayoutHeightPx / upperDefaultHeightPx, minScale, 1);
};

export const getTimelineUpperContentWidthPercent = (scale: number) => {
  if (!Number.isFinite(scale) || scale <= 0) return 100;

  return 100 / clampTimelineValue(scale, TIMELINE_UPPER_CONTENT_SCALE_MIN, 1);
};

export const getTimelineSplitMaxExpansionPx = ({
  maxExpansionPx = TIMELINE_SPLIT_MAX_EXPANSION_PX,
  upperLayoutHeightPx,
  upperMinHeightPx = TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX,
}: TimelineSplitMaxExpansionArgs) => {
  const shrinkableHeightPx = Math.max(0, upperLayoutHeightPx - upperMinHeightPx);

  return Math.min(maxExpansionPx, shrinkableHeightPx);
};

type TimelineSplitBoundsUpdateArgs = {
  currentExpansionPx: number;
  currentMaxExpansionPx: number;
  currentUpperDefaultHeightPx: number | null;
  force?: boolean;
  maxExpansionPx?: number;
  measuredUpperHeightPx: number;
  upperMinHeightPx?: number;
};

export type TimelineSplitBoundsUpdateResult = {
  nextExpansionPx: number;
  nextMaxExpansionPx: number;
  nextUpperDefaultHeightPx: number | null;
  shouldUpdateBounds: boolean;
};

export const getTimelineSplitBoundsUpdate = ({
  currentExpansionPx,
  currentMaxExpansionPx,
  currentUpperDefaultHeightPx,
  force = false,
  maxExpansionPx = TIMELINE_SPLIT_MAX_EXPANSION_PX,
  measuredUpperHeightPx,
  upperMinHeightPx = TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX,
}: TimelineSplitBoundsUpdateArgs): TimelineSplitBoundsUpdateResult => {
  const boundedCurrentMaxExpansionPx = Math.max(0, currentMaxExpansionPx);
  const boundedCurrentExpansionPx = clampTimelineValue(currentExpansionPx, 0, boundedCurrentMaxExpansionPx);

  if (!Number.isFinite(measuredUpperHeightPx) || measuredUpperHeightPx <= 0) {
    return {
      nextExpansionPx: boundedCurrentExpansionPx,
      nextMaxExpansionPx: boundedCurrentMaxExpansionPx,
      nextUpperDefaultHeightPx: currentUpperDefaultHeightPx,
      shouldUpdateBounds: false,
    };
  }

  if (!force && boundedCurrentExpansionPx > 0) {
    return {
      nextExpansionPx: boundedCurrentExpansionPx,
      nextMaxExpansionPx: boundedCurrentMaxExpansionPx,
      nextUpperDefaultHeightPx: currentUpperDefaultHeightPx,
      shouldUpdateBounds: false,
    };
  }

  const nextUpperDefaultHeightPx = Math.ceil(measuredUpperHeightPx);
  const nextMaxExpansionPx = getTimelineSplitMaxExpansionPx({
    maxExpansionPx,
    upperLayoutHeightPx: nextUpperDefaultHeightPx,
    upperMinHeightPx,
  });
  const nextExpansionPx = clampTimelineValue(boundedCurrentExpansionPx, 0, nextMaxExpansionPx);
  const shouldUpdateBounds =
    currentUpperDefaultHeightPx !== nextUpperDefaultHeightPx ||
    boundedCurrentMaxExpansionPx !== nextMaxExpansionPx ||
    boundedCurrentExpansionPx !== nextExpansionPx;

  return {
    nextExpansionPx,
    nextMaxExpansionPx,
    nextUpperDefaultHeightPx,
    shouldUpdateBounds,
  };
};

type TimelineSplitResizeArgs = {
  currentExpansionPx: number;
  deltaY: number;
  maxExpansionPx: number;
  trackScrollTopPx?: number;
};

export type TimelineSplitResizeResult = {
  nextExpansionPx: number;
  remainingDeltaY: number;
  shouldResize: boolean;
};

export const getTimelineSplitResizeResult = ({
  currentExpansionPx,
  deltaY,
  maxExpansionPx,
  trackScrollTopPx = 0,
}: TimelineSplitResizeArgs): TimelineSplitResizeResult => {
  const boundedMaxExpansionPx = Math.max(0, maxExpansionPx);
  const boundedCurrentExpansionPx = clampTimelineValue(currentExpansionPx, 0, boundedMaxExpansionPx);

  if (deltaY > 0 && boundedCurrentExpansionPx < boundedMaxExpansionPx) {
    const nextExpansionPx = clampTimelineValue(boundedCurrentExpansionPx + deltaY, 0, boundedMaxExpansionPx);

    return {
      nextExpansionPx,
      remainingDeltaY: 0,
      shouldResize: true,
    };
  }

  if (deltaY < 0 && trackScrollTopPx <= 0 && boundedCurrentExpansionPx > 0) {
    const nextExpansionPx = clampTimelineValue(boundedCurrentExpansionPx + deltaY, 0, boundedMaxExpansionPx);

    return {
      nextExpansionPx,
      remainingDeltaY: 0,
      shouldResize: true,
    };
  }

  return {
    nextExpansionPx: boundedCurrentExpansionPx,
    remainingDeltaY: deltaY,
    shouldResize: false,
  };
};

export type TimelineSplitWheelPhase = "COLLAPSED" | "EXPANDING" | "EXPANDED_AND_SCROLLING" | "COLLAPSING";

type TimelineSplitWheelUpdateArgs = {
  currentExpansionPx: number;
  deltaY: number;
  maxExpansionPx: number;
  maxTrackScrollTopPx: number;
  trackScrollTopPx: number;
};

export type TimelineSplitWheelUpdateResult = {
  nextExpansionPx: number;
  nextTrackScrollTopPx: number;
  phase: TimelineSplitWheelPhase;
  shouldPreventDefault: boolean;
};

export const getTimelineWheelDeltaPx = (deltaY: number, maxDeltaPx = TIMELINE_WHEEL_DELTA_CAP_PX) => {
  if (!Number.isFinite(deltaY)) return 0;

  return clampTimelineValue(deltaY, -Math.max(1, maxDeltaPx), Math.max(1, maxDeltaPx));
};

export const getTimelineSplitWheelUpdate = ({
  currentExpansionPx,
  deltaY,
  maxExpansionPx,
  maxTrackScrollTopPx,
  trackScrollTopPx,
}: TimelineSplitWheelUpdateArgs): TimelineSplitWheelUpdateResult => {
  const boundedMaxExpansionPx = Math.max(0, maxExpansionPx);
  const boundedMaxTrackScrollTopPx = Math.max(0, maxTrackScrollTopPx);
  const initialExpansionPx = clampTimelineValue(currentExpansionPx, 0, boundedMaxExpansionPx);
  const initialTrackScrollTopPx = clampTimelineValue(trackScrollTopPx, 0, boundedMaxTrackScrollTopPx);
  let nextExpansionPx = initialExpansionPx;
  let nextTrackScrollTopPx = initialTrackScrollTopPx;
  const normalizedDeltaY = getTimelineWheelDeltaPx(deltaY);
  let phase: TimelineSplitWheelPhase =
    nextExpansionPx <= 0
      ? "COLLAPSED"
      : nextExpansionPx >= boundedMaxExpansionPx
        ? "EXPANDED_AND_SCROLLING"
        : "EXPANDING";

  if (normalizedDeltaY > 0) {
    if (nextExpansionPx < boundedMaxExpansionPx) {
      const expansionDeltaPx = Math.min(normalizedDeltaY, boundedMaxExpansionPx - nextExpansionPx);

      nextExpansionPx += expansionDeltaPx;
      phase = "EXPANDING";
    } else {
      nextTrackScrollTopPx = clampTimelineValue(nextTrackScrollTopPx + normalizedDeltaY, 0, boundedMaxTrackScrollTopPx);
      phase = "EXPANDED_AND_SCROLLING";
    }
  } else if (normalizedDeltaY < 0) {
    if (nextTrackScrollTopPx > 0) {
      const scrollDeltaPx = Math.max(normalizedDeltaY, -nextTrackScrollTopPx);

      nextTrackScrollTopPx += scrollDeltaPx;
      phase = "EXPANDED_AND_SCROLLING";
    } else if (nextExpansionPx > 0) {
      const collapseDeltaPx = Math.max(normalizedDeltaY, -nextExpansionPx);

      nextExpansionPx += collapseDeltaPx;
      phase = nextExpansionPx <= 0 ? "COLLAPSED" : "COLLAPSING";
    }
  }

  const didConsumeDelta = nextExpansionPx !== initialExpansionPx || nextTrackScrollTopPx !== initialTrackScrollTopPx;
  const ownsVerticalWheel =
    normalizedDeltaY > 0
      ? boundedMaxExpansionPx > 0 || boundedMaxTrackScrollTopPx > 0
      : normalizedDeltaY < 0
        ? initialExpansionPx > 0 || boundedMaxTrackScrollTopPx > 0
        : false;

  return {
    nextExpansionPx,
    nextTrackScrollTopPx,
    phase,
    shouldPreventDefault: didConsumeDelta || ownsVerticalWheel,
  };
};

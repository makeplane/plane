export const TIMELINE_PANEL_MIN_HEIGHT_PX = 240;

export const TIMELINE_PAGE_SCROLL_CLASS = "h-full overflow-y-auto px-3 pt-3";

export const TIMELINE_PAGE_CONTENT_CLASS = "flex w-full flex-col gap-3 pb-3";

export const TIMELINE_PANEL_ROOT_CLASS = `flex min-h-[${TIMELINE_PANEL_MIN_HEIGHT_PX}px] flex-col overflow-visible`;

export const TIMELINE_TRACKS_SCROLL_CLASS = "min-h-0";

export const TIMELINE_TRACKS_ROW_CLASS = "flex min-w-0";

export const TIMELINE_LANE_LABEL_COLUMN_CLASS = "w-[220px] shrink-0 border-r border-custom-border-200";

export const TIMELINE_HORIZONTAL_SCROLL_CLASS = "min-w-0 flex-1 overflow-x-hidden overflow-y-hidden";

export const TIMELINE_CANVAS_CONTENT_CLASS = "relative";

export const TIMELINE_STICKY_FOOTER_CLASS = "sticky bottom-0 z-[5] shrink-0 overflow-hidden bg-custom-background-100";

export const TIMELINE_RULER_SCROLL_CLASS =
  "sg-event-timeline-scrollbar horizontal-scrollbar scrollbar-md h-10 min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-gutter:stable]";

export const TIMELINE_RULER_CONTENT_CLASS = "relative h-10";

type TimelineHorizontalWheelDeltaArgs = {
  deltaX: number;
  deltaY: number;
  shiftKey?: boolean;
};

type TimelineZoomWheelArgs = {
  altKey?: boolean;
  deltaY: number;
};

export const getTimelineHorizontalWheelDeltaPx = ({
  deltaX,
  deltaY,
  shiftKey = false,
}: TimelineHorizontalWheelDeltaArgs) => {
  const normalizedDeltaX = Number.isFinite(deltaX) ? deltaX : 0;
  const normalizedDeltaY = Number.isFinite(deltaY) ? deltaY : 0;

  if (shiftKey && normalizedDeltaY !== 0) return normalizedDeltaY;

  return Math.abs(normalizedDeltaX) > Math.abs(normalizedDeltaY) ? normalizedDeltaX : 0;
};

export const getTimelineZoomWheelDirection = ({ altKey = false, deltaY }: TimelineZoomWheelArgs) => {
  const normalizedDeltaY = Number.isFinite(deltaY) ? deltaY : 0;
  if (!altKey || normalizedDeltaY === 0) return null;

  return normalizedDeltaY < 0 ? "in" : "out";
};

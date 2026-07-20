export const TIMELINE_PANEL_MIN_HEIGHT_PX = 240;
export const TIMELINE_PANEL_VIEWPORT_PADDING_PX = 12;

export const TIMELINE_PANEL_ROOT_CLASS = "flex min-h-0 flex-col overflow-hidden";

export const TIMELINE_TRACKS_SCROLL_CLASS =
  "vertical-scrollbar scrollbar-sm min-h-0 flex-1 overflow-x-hidden overflow-y-auto";

export const TIMELINE_TRACKS_ROW_CLASS = "flex min-w-0";

export const TIMELINE_LANE_LABEL_COLUMN_CLASS = "w-[220px] shrink-0 border-r border-custom-border-200";

export const TIMELINE_HORIZONTAL_SCROLL_CLASS =
  "horizontal-scrollbar scrollbar-sm min-w-0 flex-1 overflow-x-auto overflow-y-hidden";

export const TIMELINE_STICKY_FOOTER_CLASS = "sticky bottom-0 z-[4] bg-custom-background-100";

export const TIMELINE_FIXED_FOOTER_CLASS = "shrink-0 bg-custom-background-100";

export const TIMELINE_RULER_SCROLL_CLASS =
  "horizontal-scrollbar scrollbar-sm min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2";

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

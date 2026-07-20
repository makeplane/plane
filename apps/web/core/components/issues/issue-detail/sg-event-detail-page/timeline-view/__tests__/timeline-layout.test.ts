import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import * as timelineLayout from "../utils/timeline-layout.ts";

const {
  TIMELINE_FIXED_FOOTER_CLASS,
  TIMELINE_HORIZONTAL_SCROLL_CLASS,
  TIMELINE_PANEL_MIN_HEIGHT_PX,
  TIMELINE_PANEL_ROOT_CLASS,
  TIMELINE_RULER_SCROLL_CLASS,
  TIMELINE_TRACKS_SCROLL_CLASS,
  getTimelinePanelMaxHeightPx,
} = timelineLayout;

test("timeline panel max height is calculated from remaining viewport space", () => {
  assert.equal(
    getTimelinePanelMaxHeightPx({
      panelTopPx: 240,
      viewportHeightPx: 900,
    }),
    648
  );
});

test("timeline panel max height keeps a usable minimum for constrained viewports", () => {
  assert.equal(
    getTimelinePanelMaxHeightPx({
      panelTopPx: 780,
      viewportHeightPx: 900,
    }),
    TIMELINE_PANEL_MIN_HEIGHT_PX
  );
});

test("timeline vertical overflow is owned by the track scroll region", () => {
  assert.match(TIMELINE_PANEL_ROOT_CLASS, /\bflex\b/);
  assert.match(TIMELINE_PANEL_ROOT_CLASS, /\bmin-h-0\b/);
  assert.match(TIMELINE_PANEL_ROOT_CLASS, /\boverflow-hidden\b/);

  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\bflex-1\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\bmin-h-0\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\boverflow-x-hidden\b/);

  assert.match(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\boverflow-x-auto\b/);
  assert.match(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\boverflow-y-hidden\b/);
});

test("timeline ruler footer stays outside vertical track scrolling", () => {
  assert.match(TIMELINE_FIXED_FOOTER_CLASS, /\bshrink-0\b/);
  assert.match(TIMELINE_FIXED_FOOTER_CLASS, /\bbg-custom-background-100\b/);
  assert.doesNotMatch(TIMELINE_FIXED_FOOTER_CLASS, /\bsticky\b/);

  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-x-auto\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-hidden\b/);
  assert.doesNotMatch(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-auto\b/);
});

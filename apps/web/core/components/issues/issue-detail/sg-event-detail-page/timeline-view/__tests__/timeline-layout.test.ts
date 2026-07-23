import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import * as timelineLayout from "../utils/timeline-layout.ts";

const {
  TIMELINE_CANVAS_CONTENT_CLASS,
  TIMELINE_HORIZONTAL_SCROLL_CLASS,
  TIMELINE_PAGE_CONTENT_CLASS,
  TIMELINE_PAGE_SCROLL_CLASS,
  TIMELINE_PANEL_MIN_HEIGHT_PX,
  TIMELINE_PANEL_ROOT_CLASS,
  TIMELINE_RULER_CONTENT_CLASS,
  TIMELINE_RULER_SCROLL_CLASS,
  TIMELINE_STICKY_FOOTER_CLASS,
  TIMELINE_TRACKS_SCROLL_CLASS,
  getTimelineHorizontalWheelDeltaPx,
} = timelineLayout;

test("timeline page scrollport exposes a flush sticky bottom edge", () => {
  assert.match(TIMELINE_PAGE_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.match(TIMELINE_PAGE_SCROLL_CLASS, /\bpt-3\b/);
  assert.doesNotMatch(TIMELINE_PAGE_SCROLL_CLASS, /\bpy-3\b/);
  assert.doesNotMatch(TIMELINE_PAGE_SCROLL_CLASS, /\bpb-3\b/);

  assert.match(TIMELINE_PAGE_CONTENT_CLASS, /\bpb-3\b/);
});

test("timeline section participates in natural vertical document flow", () => {
  assert.match(TIMELINE_PANEL_ROOT_CLASS, /\bflex\b/);
  assert.ok(TIMELINE_PANEL_ROOT_CLASS.includes(`min-h-[${TIMELINE_PANEL_MIN_HEIGHT_PX}px]`));
  assert.doesNotMatch(TIMELINE_PANEL_ROOT_CLASS, /\boverflow-hidden\b/);
  assert.doesNotMatch(TIMELINE_PANEL_ROOT_CLASS, /\boverscroll-contain\b/);

  assert.doesNotMatch(TIMELINE_TRACKS_SCROLL_CLASS, /\bpb-\d+\b/);
  assert.doesNotMatch(TIMELINE_TRACKS_SCROLL_CLASS, /\bvertical-scrollbar\b/);
  assert.doesNotMatch(TIMELINE_TRACKS_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.doesNotMatch(TIMELINE_TRACKS_SCROLL_CLASS, /\bflex-1\b/);
  assert.doesNotMatch(TIMELINE_TRACKS_SCROLL_CLASS, /\boverscroll-contain\b/);
});

test("timeline footer is sticky inside the timeline section", () => {
  assert.match(TIMELINE_STICKY_FOOTER_CLASS, /\bsticky\b/);
  assert.match(TIMELINE_STICKY_FOOTER_CLASS, /\bbottom-0\b/);
  assert.ok(TIMELINE_STICKY_FOOTER_CLASS.includes("z-[5]"));
  assert.match(TIMELINE_STICKY_FOOTER_CLASS, /\bbg-custom-background-100\b/);
  assert.doesNotMatch(TIMELINE_STICKY_FOOTER_CLASS, /\bfixed\b/);

  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\bh-10\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-x-auto\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-hidden\b/);
  assert.doesNotMatch(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\bsg-event-timeline-scrollbar\b/);
});

test("timeline has a single visible horizontal scrollbar", () => {
  const horizontalOwnerCount = [TIMELINE_HORIZONTAL_SCROLL_CLASS, TIMELINE_RULER_SCROLL_CLASS].filter(
    (className) => /\bhorizontal-scrollbar\b/.test(className) && /\boverflow-x-auto\b/.test(className)
  ).length;

  assert.equal(horizontalOwnerCount, 1);
  assert.doesNotMatch(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\bhorizontal-scrollbar\b/);
  assert.doesNotMatch(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\boverflow-x-auto\b/);
});

test("timeline content width changes are not animated between zoom levels", () => {
  assert.equal(typeof TIMELINE_CANVAS_CONTENT_CLASS, "string");
  assert.equal(typeof TIMELINE_RULER_CONTENT_CLASS, "string");
  assert.doesNotMatch(TIMELINE_CANVAS_CONTENT_CLASS, /transition-\[width\]/);
  assert.doesNotMatch(TIMELINE_RULER_CONTENT_CLASS, /transition-\[width\]/);
});

test("ordinary vertical wheel input does not move the horizontal timeline", () => {
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: 0, deltaY: 120 }), 0);
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: 8, deltaY: 120 }), 0);
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: 40, deltaY: 40 }), 0);
});

test("intentional horizontal wheel input can move the horizontal timeline", () => {
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: 120, deltaY: 8 }), 120);
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: -80, deltaY: 12 }), -80);
  assert.equal(getTimelineHorizontalWheelDeltaPx({ deltaX: 0, deltaY: 90, shiftKey: true }), 90);
});

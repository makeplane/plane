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
  TIMELINE_SPLIT_MAX_EXPANSION_PX,
  TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX,
  TIMELINE_TRACKS_SCROLL_CLASS,
  TIMELINE_UPPER_CONTENT_SCALE_MIN,
  getTimelinePanelMaxHeightPx,
  getTimelineSplitBoundsUpdate,
  getTimelineSplitMaxExpansionPx,
  getTimelineSplitResizeResult,
  getTimelineSplitWheelUpdate,
  getTimelineUpperContentScale,
  getTimelineUpperContentWidthPercent,
  getTimelineWheelDeltaPx,
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

  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\bsg-event-timeline-scrollbar\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\bflex-1\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\bmin-h-0\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.match(TIMELINE_TRACKS_SCROLL_CLASS, /\boverflow-x-hidden\b/);
  assert.ok(TIMELINE_TRACKS_SCROLL_CLASS.includes("[scrollbar-gutter:stable]"));

  assert.match(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\boverflow-x-hidden\b/);
  assert.match(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\boverflow-y-hidden\b/);
  assert.doesNotMatch(TIMELINE_HORIZONTAL_SCROLL_CLASS, /\bhorizontal-scrollbar\b/);
});

test("timeline ruler footer stays outside vertical track scrolling", () => {
  assert.match(TIMELINE_FIXED_FOOTER_CLASS, /\bshrink-0\b/);
  assert.match(TIMELINE_FIXED_FOOTER_CLASS, /\boverflow-hidden\b/);
  assert.match(TIMELINE_FIXED_FOOTER_CLASS, /\bbg-custom-background-100\b/);
  assert.ok(TIMELINE_FIXED_FOOTER_CLASS.includes("[contain:layout_paint]"));
  assert.doesNotMatch(TIMELINE_FIXED_FOOTER_CLASS, /\bsticky\b/);

  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\bh-10\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-x-auto\b/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-hidden\b/);
  assert.doesNotMatch(TIMELINE_RULER_SCROLL_CLASS, /\boverflow-y-auto\b/);
  assert.doesNotMatch(TIMELINE_RULER_SCROLL_CLASS, /\bpb-\d/);
  assert.match(TIMELINE_RULER_SCROLL_CLASS, /\bsg-event-timeline-scrollbar\b/);
  assert.ok(TIMELINE_RULER_SCROLL_CLASS.includes("[scrollbar-gutter:stable]"));
});

test("timeline has a single visible horizontal scroll owner", () => {
  const horizontalOwnerCount = [TIMELINE_HORIZONTAL_SCROLL_CLASS, TIMELINE_RULER_SCROLL_CLASS].filter(
    (className) => /\bhorizontal-scrollbar\b/.test(className) && /\boverflow-x-auto\b/.test(className)
  ).length;

  assert.equal(horizontalOwnerCount, 1);
});

test("timeline split max expansion is bounded by upper section minimum height", () => {
  assert.equal(
    getTimelineSplitMaxExpansionPx({
      upperLayoutHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + 120,
    }),
    120
  );

  assert.equal(
    getTimelineSplitMaxExpansionPx({
      upperLayoutHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + TIMELINE_SPLIT_MAX_EXPANSION_PX + 100,
    }),
    TIMELINE_SPLIT_MAX_EXPANSION_PX
  );
});

test("timeline split consumes downward wheel delta to expand before internal scrolling", () => {
  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 40,
      deltaY: 90,
      maxExpansionPx: 180,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 130,
      remainingDeltaY: 0,
      shouldResize: true,
    }
  );
});

test("timeline split consumes the wheel event that reaches the expansion limit", () => {
  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 160,
      deltaY: 80,
      maxExpansionPx: 180,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 180,
      remainingDeltaY: 0,
      shouldResize: true,
    }
  );
});

test("timeline split lets internal scrolling continue after maximum expansion", () => {
  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 180,
      deltaY: 40,
      maxExpansionPx: 180,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 180,
      remainingDeltaY: 40,
      shouldResize: false,
    }
  );
});

test("timeline split contracts only after the track scroller is at the top", () => {
  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 120,
      deltaY: -60,
      maxExpansionPx: 180,
      trackScrollTopPx: 20,
    }),
    {
      nextExpansionPx: 120,
      remainingDeltaY: -60,
      shouldResize: false,
    }
  );

  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 120,
      deltaY: -60,
      maxExpansionPx: 180,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 60,
      remainingDeltaY: 0,
      shouldResize: true,
    }
  );
});

test("timeline split clamps upward contraction at the restored layout", () => {
  assert.deepEqual(
    getTimelineSplitResizeResult({
      currentExpansionPx: 30,
      deltaY: -100,
      maxExpansionPx: 180,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 0,
      remainingDeltaY: 0,
      shouldResize: true,
    }
  );
});

test("timeline wheel normalizes large deltas to avoid binary resize jumps", () => {
  assert.equal(getTimelineWheelDeltaPx(12), 12);
  assert.equal(getTimelineWheelDeltaPx(900), 16);
  assert.equal(getTimelineWheelDeltaPx(-900), -16);
});

test("timeline wheel expands downward without moving internal track scroll", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 40,
      deltaY: 60,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 120,
    }),
    {
      nextExpansionPx: 56,
      nextTrackScrollTopPx: 120,
      phase: "EXPANDING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel does not scroll tracks during the same update that reaches max expansion", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 170,
      deltaY: 80,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 120,
    }),
    {
      nextExpansionPx: 180,
      nextTrackScrollTopPx: 120,
      phase: "EXPANDING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel scrolls internally at maximum expansion without changing layout height", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 180,
      deltaY: 70,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 120,
    }),
    {
      nextExpansionPx: 180,
      nextTrackScrollTopPx: 136,
      phase: "EXPANDED_AND_SCROLLING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel scrolls upward to the top before collapsing", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 180,
      deltaY: -80,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 120,
    }),
    {
      nextExpansionPx: 180,
      nextTrackScrollTopPx: 104,
      phase: "EXPANDED_AND_SCROLLING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel does not collapse during the same update that reaches internal scroll top", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 180,
      deltaY: -80,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 10,
    }),
    {
      nextExpansionPx: 180,
      nextTrackScrollTopPx: 0,
      phase: "EXPANDED_AND_SCROLLING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel collapses only after internal scroll is already at the top", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 180,
      deltaY: -80,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 0,
    }),
    {
      nextExpansionPx: 164,
      nextTrackScrollTopPx: 0,
      phase: "COLLAPSING",
      shouldPreventDefault: true,
    }
  );
});

test("timeline wheel sequence expands to max before any internal track scroll", () => {
  let expansionPx = 0;
  let trackScrollTopPx = 80;

  for (let step = 0; step < 4; step += 1) {
    const update = getTimelineSplitWheelUpdate({
      currentExpansionPx: expansionPx,
      deltaY: 80,
      maxExpansionPx: 64,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx,
    });

    expansionPx = update.nextExpansionPx;
    trackScrollTopPx = update.nextTrackScrollTopPx;
  }

  assert.equal(expansionPx, 64);
  assert.equal(trackScrollTopPx, 80);

  const scrollUpdate = getTimelineSplitWheelUpdate({
    currentExpansionPx: expansionPx,
    deltaY: 80,
    maxExpansionPx: 64,
    maxTrackScrollTopPx: 500,
    trackScrollTopPx,
  });

  assert.deepEqual(scrollUpdate, {
    nextExpansionPx: 64,
    nextTrackScrollTopPx: 96,
    phase: "EXPANDED_AND_SCROLLING",
    shouldPreventDefault: true,
  });
});

test("timeline wheel sequence scrolls back to top before restoring layout height", () => {
  let expansionPx = 64;
  let trackScrollTopPx = 40;

  for (let step = 0; step < 3; step += 1) {
    const update = getTimelineSplitWheelUpdate({
      currentExpansionPx: expansionPx,
      deltaY: -80,
      maxExpansionPx: 64,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx,
    });

    expansionPx = update.nextExpansionPx;
    trackScrollTopPx = update.nextTrackScrollTopPx;
  }

  assert.equal(expansionPx, 64);
  assert.equal(trackScrollTopPx, 0);

  const collapseUpdate = getTimelineSplitWheelUpdate({
    currentExpansionPx: expansionPx,
    deltaY: -80,
    maxExpansionPx: 64,
    maxTrackScrollTopPx: 500,
    trackScrollTopPx,
  });

  assert.deepEqual(collapseUpdate, {
    nextExpansionPx: 48,
    nextTrackScrollTopPx: 0,
    phase: "COLLAPSING",
    shouldPreventDefault: true,
  });
});

test("timeline split bounds ignore ResizeObserver measurements while the split is expanded", () => {
  assert.deepEqual(
    getTimelineSplitBoundsUpdate({
      currentExpansionPx: 120,
      currentMaxExpansionPx: 180,
      currentUpperDefaultHeightPx: 620,
      measuredUpperHeightPx: 500,
    }),
    {
      nextExpansionPx: 120,
      nextMaxExpansionPx: 180,
      nextUpperDefaultHeightPx: 620,
      shouldUpdateBounds: false,
    }
  );
});

test("timeline split bounds refresh when restored or forced by viewport changes", () => {
  assert.deepEqual(
    getTimelineSplitBoundsUpdate({
      currentExpansionPx: 0,
      currentMaxExpansionPx: 180,
      currentUpperDefaultHeightPx: 620,
      measuredUpperHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + 80,
    }),
    {
      nextExpansionPx: 0,
      nextMaxExpansionPx: 80,
      nextUpperDefaultHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + 80,
      shouldUpdateBounds: true,
    }
  );

  assert.deepEqual(
    getTimelineSplitBoundsUpdate({
      currentExpansionPx: 160,
      currentMaxExpansionPx: 180,
      currentUpperDefaultHeightPx: 620,
      force: true,
      measuredUpperHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + 120,
    }),
    {
      nextExpansionPx: 120,
      nextMaxExpansionPx: 120,
      nextUpperDefaultHeightPx: TIMELINE_SPLIT_UPPER_MIN_HEIGHT_PX + 120,
      shouldUpdateBounds: true,
    }
  );
});

test("timeline upper content scales into the shrinking layout instead of being clipped", () => {
  assert.equal(
    getTimelineUpperContentScale({
      upperDefaultHeightPx: 600,
      upperLayoutHeightPx: 600,
    }),
    1
  );

  assert.equal(
    getTimelineUpperContentScale({
      upperDefaultHeightPx: 600,
      upperLayoutHeightPx: 420,
    }),
    0.7
  );

  assert.equal(
    getTimelineUpperContentScale({
      upperDefaultHeightPx: 600,
      upperLayoutHeightPx: 60,
    }),
    TIMELINE_UPPER_CONTENT_SCALE_MIN
  );

  assert.equal(
    getTimelineUpperContentScale({
      upperDefaultHeightPx: null,
      upperLayoutHeightPx: 420,
    }),
    1
  );
});

test("timeline upper content width compensates for transform scaling", () => {
  assert.equal(getTimelineUpperContentWidthPercent(1), 100);
  assert.equal(getTimelineUpperContentWidthPercent(0.8), 125);
  assert.equal(getTimelineUpperContentWidthPercent(0.5), 200);
});

test("timeline wheel prevents page scroll leakage while timeline owns vertical scrolling", () => {
  assert.deepEqual(
    getTimelineSplitWheelUpdate({
      currentExpansionPx: 180,
      deltaY: 50,
      maxExpansionPx: 180,
      maxTrackScrollTopPx: 500,
      trackScrollTopPx: 500,
    }),
    {
      nextExpansionPx: 180,
      nextTrackScrollTopPx: 500,
      phase: "EXPANDED_AND_SCROLLING",
      shouldPreventDefault: true,
    }
  );
});

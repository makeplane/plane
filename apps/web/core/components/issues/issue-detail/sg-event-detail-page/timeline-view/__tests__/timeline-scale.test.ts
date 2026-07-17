import assert from "node:assert/strict";
import test from "node:test";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import * as timelineScale from "../utils/timeline-scale.ts";

const {
  DEFAULT_TIMELINE_SCALE_INDEX,
  MIN_SECOND_TICK_SPACING_PX,
  TIMELINE_SCALE_LEVELS,
  buildScaledTimelineTicks,
  getTimelineTagEndSeconds,
  getTimelinePanelInputPlayheadSeconds,
  getTimelinePlaybackSeconds,
  getNextTimelineScaleIndex,
  getTimelineRangePixels,
  getTimelinePositionPercent,
  getTimelineContentWidth,
  getTimelineScaleLabel,
  isTimelineTagPlaybackOverrideId,
} = timelineScale;

test("timeline scale controls clamp at supported zoom bounds", () => {
  assert.equal(getNextTimelineScaleIndex(DEFAULT_TIMELINE_SCALE_INDEX, "in"), DEFAULT_TIMELINE_SCALE_INDEX + 1);
  assert.equal(getNextTimelineScaleIndex(DEFAULT_TIMELINE_SCALE_INDEX, "out"), DEFAULT_TIMELINE_SCALE_INDEX - 1);
  assert.equal(getNextTimelineScaleIndex(0, "out"), 0);
  assert.equal(getNextTimelineScaleIndex(TIMELINE_SCALE_LEVELS.length - 1, "in"), TIMELINE_SCALE_LEVELS.length - 1);
});

test("timeline content width expands and contracts from the default scale", () => {
  const defaultWidth = getTimelineContentWidth(TIMELINE_SCALE_LEVELS[DEFAULT_TIMELINE_SCALE_INDEX]);
  const zoomedInWidth = getTimelineContentWidth(TIMELINE_SCALE_LEVELS[DEFAULT_TIMELINE_SCALE_INDEX + 2]);
  const zoomedOutWidth = getTimelineContentWidth(TIMELINE_SCALE_LEVELS[DEFAULT_TIMELINE_SCALE_INDEX - 1]);

  assert.ok(zoomedInWidth > defaultWidth);
  assert.ok(zoomedOutWidth < defaultWidth);
  assert.match(getTimelineScaleLabel(TIMELINE_SCALE_LEVELS[DEFAULT_TIMELINE_SCALE_INDEX]), /^\d+%$/);
});

test("timeline content can exceed the viewport width when users zoom in", () => {
  const compactViewportWidth = 900;
  const zoomedInWidth = getTimelineContentWidth(2);

  assert.ok(zoomedInWidth > compactViewportWidth);
});

test("timeline positions are clamped to the shared percent coordinate system", () => {
  assert.equal(getTimelinePositionPercent(0, 120), 0);
  assert.equal(getTimelinePositionPercent(30, 120), 25);
  assert.equal(getTimelinePositionPercent(120, 120), 100);
  assert.equal(getTimelinePositionPercent(150, 120), 100);
  assert.equal(getTimelinePositionPercent(-5, 120), 0);
});

test("timeline ticks become more precise when zooming in and coarser when zooming out", () => {
  const zoomedOutTicks = buildScaledTimelineTicks(3600, 0.5);
  const defaultTicks = buildScaledTimelineTicks(3600, 1);
  const zoomedInTicks = buildScaledTimelineTicks(3600, 4);

  assert.ok(defaultTicks.length > zoomedOutTicks.length);
  assert.ok(zoomedInTicks.length > defaultTicks.length);
  assert.equal(zoomedInTicks[0]?.position, 0);
  assert.equal(zoomedInTicks.at(-1)?.position, 100);
});

test("maximum timeline zoom supports readable one-second precision", () => {
  const eventDurationSeconds = 20 * 60;
  const maxScale = TIMELINE_SCALE_LEVELS.at(-1) ?? 1;
  const contentWidth = getTimelineContentWidth(maxScale, eventDurationSeconds);
  const ticks = buildScaledTimelineTicks(eventDurationSeconds, maxScale);

  assert.ok(contentWidth / eventDurationSeconds >= MIN_SECOND_TICK_SPACING_PX);
  assert.equal(ticks[1]?.label, "00:01");
  assert.equal(ticks[1]?.position, (1 * 100) / eventDurationSeconds);
  assert.equal(ticks.at(-1)?.position, 100);
  assert.equal(getTimelineScaleLabel(maxScale), "1 sec");
});

test("timeline tag ranges use duration-based pixel geometry at one-second zoom", () => {
  const totalSeconds = 20;
  const contentWidth = getTimelineContentWidth(TIMELINE_SCALE_LEVELS.at(-1) ?? 1, totalSeconds);
  const range = getTimelineRangePixels({
    contentWidthPx: contentWidth,
    endSeconds: 12,
    startSeconds: 4,
    totalSeconds,
  });
  const pixelsPerSecond = contentWidth / totalSeconds;

  assert.ok(pixelsPerSecond >= MIN_SECOND_TICK_SPACING_PX);
  assert.equal(range.leftPx, 4 * pixelsPerSecond);
  assert.equal(range.widthPx, 8 * pixelsPerSecond);
});

test("timeline tag end prefers actual clip duration over a wider display timecode range", () => {
  assert.equal(
    getTimelineTagEndSeconds({
      clipDurationSeconds: 8,
      explicitEndSeconds: 24,
      startSeconds: 12,
    }),
    20
  );
});

test("timeline tag end does not default unknown tags to twelve seconds", () => {
  assert.equal(
    getTimelineTagEndSeconds({
      clipDurationSeconds: null,
      explicitEndSeconds: null,
      startSeconds: 12,
    }),
    20
  );
});

test("timeline tag ranges recalculate positions and widths across zoom levels", () => {
  const totalSeconds = 100;
  const zoomedOutWidth = getTimelineContentWidth(0.5, totalSeconds);
  const zoomedInWidth = getTimelineContentWidth(1.25, totalSeconds);
  const zoomedOutRange = getTimelineRangePixels({
    contentWidthPx: zoomedOutWidth,
    endSeconds: 18,
    startSeconds: 10,
    totalSeconds,
  });
  const zoomedInRange = getTimelineRangePixels({
    contentWidthPx: zoomedInWidth,
    endSeconds: 18,
    startSeconds: 10,
    totalSeconds,
  });

  assert.ok(zoomedInRange.leftPx > zoomedOutRange.leftPx);
  assert.ok(zoomedInRange.widthPx > zoomedOutRange.widthPx);
  assert.equal(zoomedOutRange.leftPx, (10 / totalSeconds) * zoomedOutWidth);
  assert.ok(Math.abs(zoomedOutRange.widthPx - (8 / totalSeconds) * zoomedOutWidth) < 0.000001);
  assert.equal(zoomedInRange.leftPx, (10 / totalSeconds) * zoomedInWidth);
  assert.ok(Math.abs(zoomedInRange.widthPx - (8 / totalSeconds) * zoomedInWidth) < 0.000001);
});

test("clip-relative playback maps back onto the full stream timeline", () => {
  assert.equal(
    getTimelinePlaybackSeconds({
      activeClipStartSeconds: 100,
      isClipPlaybackActive: true,
      playheadSeconds: 3,
    }),
    103
  );
  assert.equal(
    getTimelinePlaybackSeconds({
      activeClipStartSeconds: 100,
      isClipPlaybackActive: false,
      playheadSeconds: 3,
    }),
    3
  );
});

test("timeline panel receives clip-local playhead seconds only for tag playback overrides", () => {
  assert.equal(isTimelineTagPlaybackOverrideId("sg-tag-row-1"), true);
  assert.equal(isTimelineTagPlaybackOverrideId("sg-matrix-playlist-generated"), false);
  assert.equal(isTimelineTagPlaybackOverrideId(null), false);

  assert.equal(
    getTimelinePanelInputPlayheadSeconds({
      playbackOverrideId: "sg-tag-row-1",
      playheadBaseSeconds: 100,
      playerLocalSeconds: 3,
    }),
    3
  );
  assert.equal(
    getTimelinePanelInputPlayheadSeconds({
      playbackOverrideId: "sg-matrix-playlist-generated",
      playheadBaseSeconds: 100,
      playerLocalSeconds: 3,
    }),
    3
  );
  assert.equal(
    getTimelinePanelInputPlayheadSeconds({
      playbackOverrideId: null,
      playheadBaseSeconds: 100,
      playerLocalSeconds: 3,
    }),
    103
  );
});

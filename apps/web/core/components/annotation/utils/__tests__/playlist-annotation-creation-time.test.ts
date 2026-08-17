import assert from "node:assert/strict";
import test from "node:test";

import type { TCustomPlaylistAnnotation } from "../../types/annotation.types";

// Node's type-stripping test runner requires explicit TypeScript extensions.
// @ts-expect-error See comment above.
import * as playlistAnnotationCreationTime from "../playlist-annotation-creation-time.ts";

const { applyAnnotationCreationStartTimeOffset, getAnnotationStartTimeWithCreationOffset } =
  playlistAnnotationCreationTime;

const createAnnotation = (startTime: number, endTime: number): TCustomPlaylistAnnotation => ({
  createdAt: "2026-08-17T00:00:00.000Z",
  endTime,
  height: 100,
  id: `annotation-${startTime}-${endTime}`,
  startTime,
  style: {
    stroke: "#f97316",
    strokeStyle: "solid",
    strokeWidth: 5,
  },
  type: "rectangle",
  width: 100,
  x: 100,
  y: 100,
});

test("annotation creation start time is offset one second before the playhead", () => {
  assert.equal(getAnnotationStartTimeWithCreationOffset(18), 17);
  assert.equal(getAnnotationStartTimeWithCreationOffset(85.5), 84.5);
});

test("annotation creation start time never becomes negative", () => {
  assert.equal(getAnnotationStartTimeWithCreationOffset(0.5), 0);
  assert.equal(getAnnotationStartTimeWithCreationOffset(0), 0);
});

test("annotation creation offset preserves the selected duration", () => {
  const offsetWholeSecondAnnotation = applyAnnotationCreationStartTimeOffset(createAnnotation(18, 20));
  const offsetSubSecondAnnotation = applyAnnotationCreationStartTimeOffset(createAnnotation(0.5, 2.5));

  assert.equal(offsetWholeSecondAnnotation.startTime, 17);
  assert.equal(offsetWholeSecondAnnotation.endTime, 19);
  assert.equal(offsetWholeSecondAnnotation.id, "annotation-18-20");
  assert.equal(offsetSubSecondAnnotation.startTime, 0);
  assert.equal(offsetSubSecondAnnotation.endTime, 2);
  assert.equal(offsetSubSecondAnnotation.id, "annotation-0.5-2.5");
});

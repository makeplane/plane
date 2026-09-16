import assert from "node:assert/strict";
import test from "node:test";
import "./register-types.mjs";
const model = await import("../voice-narration.ts");
const { NarrationDucking } = await import("../narration-ducking.ts");
const { normalizePlaylistAnnotations, arePlaylistAnnotationsEqual } = await import("../playlist-annotation-model.ts");
const { buildAnnotationTimelineMoments, getTimelinePercent, getTimelineContentWidthPx } =
  await import("../video-annotation-timeline.ts");
const clip = (id = "a", startTime = 5, endTime = 15) => ({
  id,
  startTime,
  endTime,
  type: "audio",
  content: "data:audio/webm;base64,AAAA",
  x: 0,
  y: 0,
  audio: { sourceDuration: 10, trimStart: 0, trimEnd: 0, volume: 1, ducking: 0.35, fadeIn: 0.2, fadeOut: 0.2 },
});

test("cross-origin narration downloads use the existing media proxy without cookies", () => {
  const source = "http://192.168.1.55:1437/api/blobs/media/audio/voice.webm?version=2";
  assert.deepEqual(model.narrationDownloadRequest(source, "http://plane.local:3000"), {
    url: `/api/hls/?url=${encodeURIComponent(source)}`,
    credentials: "omit",
  });
  assert.deepEqual(model.narrationDownloadRequest("https://cdn.example.com/voice.ogg", "https://sports.kanavio.com"), {
    url: `/api/hls/?url=${encodeURIComponent("https://cdn.example.com/voice.ogg")}`,
    credentials: "omit",
  });
});
test("local and same-origin narration downloads retain their existing source", () => {
  const origin = "http://plane.local:3000";
  for (const source of ["/sports/api/blobs/media/voice.webm", `${origin}/voice.webm`]) {
    assert.deepEqual(model.narrationDownloadRequest(source, origin), { url: source, credentials: "same-origin" });
  }
  for (const source of ["data:audio/webm;base64,AAAA", `blob:${origin}/audio-id`]) {
    assert.deepEqual(model.narrationDownloadRequest(source, origin), { url: source, credentials: "omit" });
  }
  for (const source of [
    "",
    "javascript:alert(1)",
    "file:///audio.webm",
    "https://user:secret@example.com/voice.webm",
  ]) {
    assert.throws(() => model.narrationDownloadRequest(source, origin));
  }
});

test("overlap uses millisecond precision and excludes touching ends and the same clip", () => {
  assert.equal(model.overlapsNarration(clip(), clip("b", 15, 20)), false);
  assert.equal(model.overlapsNarration(clip(), clip("b", 14.99, 20)), true);
  assert.equal(model.overlapsNarration(clip(), clip("b", 14.9999999, 20)), false);
  assert.equal(model.narrationOverlaps(clip(), [clip(), clip("b", 7, 9)]).length, 1);
  assert.equal(model.narrationOverlaps(clip(), [clip("b", 7, 9)], "b").length, 0);
});
test("non-destructive trim preserves the source and bounds handles", () => {
  const original = clip();
  const left = model.trimNarration(original, "start", 8);
  assert.equal(left.audio.trimStart, 3);
  assert.equal(left.endTime, 15);
  const right = model.trimNarration(left, "end", 13);
  assert.equal(right.audio.trimEnd, 2);
  assert.equal(
    right.endTime - right.startTime,
    right.audio.sourceDuration - right.audio.trimStart - right.audio.trimEnd
  );
  assert.equal(model.trimNarration(right, "start", -100).startTime, 5);
  assert.equal(model.trimNarration(right, "end", 100).endTime, 15);
  assert.ok(model.trimNarration(right, "end", 0).endTime > right.startTime);
  assert.equal(original.audio.trimStart, 0);
  assert.equal(right.content, original.content);
});
test("moving a clip preserves duration and stays in the video", () => {
  assert.deepEqual(
    [model.moveNarration(clip(), 99, 30).startTime, model.moveNarration(clip(), 99, 30).endTime],
    [20, 30]
  );
  assert.equal(model.moveNarration(clip(), -1, 30).startTime, 0);
});
test("multiple narrations share a lane unless their intervals overlap", () => {
  const lanes = model.narrationLanes([clip(), clip("b", 15, 20), clip("c", 8, 10)]);
  assert.deepEqual(
    lanes.map((lane) => lane.map((item) => item.id)),
    [["a", "b"], ["c"]]
  );
});
test("narration moments reuse rounded start times rather than duration overlap", () => {
  const moments = buildAnnotationTimelineMoments([
    clip("a", 10.01, 15),
    clip("b", 10.04, 16),
    clip("c", 10.06, 17),
    clip("d", 11, 18),
  ]);
  assert.deepEqual(
    moments.map((moment) => moment.startTime),
    [10, 10.1, 11]
  );
  assert.deepEqual(
    moments.map((moment) => moment.annotations.map(({ annotation }) => annotation.id)),
    [["a", "b"], ["c"], ["d"]]
  );
  assert.deepEqual(buildAnnotationTimelineMoments([]), []);
});
test("moving narration splits and merges its moment without changing audio", () => {
  const a = clip("a", 5, 8);
  const b = clip("b", 5.02, 8.02);
  assert.equal(buildAnnotationTimelineMoments([a, b]).length, 1);
  const moved = model.moveNarration(b, 12, 30);
  assert.deepEqual(
    buildAnnotationTimelineMoments([moved, a]).map((moment) => moment.startTime),
    [5, 12]
  );
  assert.equal(moved.content, b.content);
  assert.equal(buildAnnotationTimelineMoments([a, model.moveNarration(moved, 5.01, 30)]).length, 1);
});
test("narration uses the same position percentage at every zoom", () => {
  for (const zoom of [50, 100, 300]) {
    const width = getTimelineContentWidthPx(100, zoom);
    assert.equal((getTimelinePercent(25, 100) / 100) * width, width / 4);
  }
  assert.equal(
    buildAnnotationTimelineMoments(
      [
        clip(),
        {
          ...clip("draw"),
          type: "pen",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ].filter((item) => item.type !== "audio")
    ).length,
    1
  );
});
test("audio properties and peaks survive normalization and every edit marks dirty", () => {
  const original = normalizePlaylistAnnotations([clip()]);
  assert.equal(original[0].audio.ducking, 0.35);
  for (const changed of [
    { ...clip(), title: "Coach feedback" },
    { ...clip(), audio: { ...clip().audio, volume: 0.4 } },
    { ...clip(), audio: { ...clip().audio, ducking: null } },
    { ...clip(), audio: { ...clip().audio, fadeIn: 0.1 } },
    model.trimNarration(clip(), "start", 6),
    model.moveNarration(clip(), 8, 60),
    { ...clip(), content: "replacement" },
  ])
    assert.equal(arePlaylistAnnotationsEqual(original, normalizePlaylistAnnotations([changed])), false);
  assert.equal(arePlaylistAnnotationsEqual(original, []), false);
  assert.equal(arePlaylistAnnotationsEqual(original, normalizePlaylistAnnotations(original)), true);
});
test("legacy narrations default to no ducking and invalid values are bounded", () => {
  assert.equal(model.normalizeNarrationAudio(undefined, 12).sourceDuration, 12);
  assert.equal(model.normalizeNarrationAudio(undefined, 12).ducking, null);
  const audio = model.normalizeNarrationAudio(
    { sourceDuration: 10, trimStart: 999, trimEnd: 999, volume: 12, fadeIn: -5, peaks: [NaN, 10, -1] },
    10
  );
  assert.ok(audio.sourceDuration - audio.trimStart - audio.trimEnd >= 0.099);
  assert.equal(audio.volume, 1);
  assert.equal(audio.fadeIn, 0);
  assert.deepEqual(audio.peaks, [0, 1, 0]);
});
test("waveform peaks are bounded and sample the complete short source", () => {
  assert.deepEqual(model.sampleNarrationPeaks([new Float32Array([0, 0.5, -1])]), [0, 0.5, 1]);
  assert.equal(model.sampleNarrationPeaks([new Float32Array(20000)]).length, 512);
});
test("fades reach zero at boundaries without changing configured volume", () => {
  assert.equal(model.narrationGain(clip(), 5), 0);
  assert.ok(Math.abs(model.narrationGain(clip(), 5.1) - 0.5) < 0.001);
  assert.equal(model.narrationGain(clip(), 8), 1);
  assert.equal(model.narrationGain(clip(), 15), 0);
});
test("ducking ramps, honors manual video volume and restores on interruption", () => {
  const video = { volume: 0.8 };
  const ducking = new NarrationDucking(video);
  ducking.tick(0.35, 0.05);
  assert.ok(video.volume < 0.8 && video.volume > 0.28);
  ducking.tick(0.35, 1);
  assert.ok(Math.abs(video.volume - 0.28) < 0.001);
  video.volume = 0.6;
  ducking.tick(0.35, 1);
  ducking.restore();
  assert.equal(video.volume, 0.6);
  ducking.tick(0.35, 1);
  ducking.tick(1, 1);
  assert.equal(video.volume, 0.6);
});
test("microphone errors give actionable permission and device recovery", () => {
  for (const name of ["NotAllowedError", "NotFoundError", "OverconstrainedError", "NotReadableError"]) {
    const error = new Error();
    error.name = name;
    assert.ok(model.narrationMicrophoneError(error).length > 30);
  }
});

test("time discontinuity checks use the logical player clock", () => {
  assert.equal(model.isNarrationTimeDiscontinuous(14.23, 2, 16.25, true), false);
  assert.equal(model.isNarrationTimeDiscontinuous(14.23, 2, 100, true), true);
  assert.equal(model.isNarrationTimeDiscontinuous(14.23, 10, 14.23, false), false);
  assert.equal(model.isNarrationTimeDiscontinuous(14.23, 0, 20, false), true);
  assert.equal(model.isNarrationTimeDiscontinuous(0, 0, Number.NaN, true), true);
});

test("invalid trim and move inputs keep the original clip", () => {
  const original = clip();
  assert.equal(model.trimNarration(original, "end", Number.NaN), original);
  assert.equal(model.moveNarration(original, Number.NaN, 30), original);
});

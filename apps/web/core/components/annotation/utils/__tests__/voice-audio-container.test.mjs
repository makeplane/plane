import assert from "node:assert/strict";
import test from "node:test";
import { WebmFile, WebmBase } from "@fix-webm-duration/parser";
import "./register-types.mjs";
const { finalizeNarrationAudio } = await import("../narration-audio-container.ts");
const { narrationAudio } = await import("../voice-narration.ts");

// Real Chrome MediaRecorder header/Opus track, with microphone packets removed.
const header =
  "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFhxYq/zfjewWDgQKGhkFfT1BVU2Oik09wdXNIZWFkAQEAAIC7AAAAAADhjbWERzuAAJ+BAWJkgSA=";
const source = () => {
  const file = new WebmFile(new Uint8Array(Buffer.from(header, "base64")));
  const cluster = new WebmBase("Cluster");
  cluster.setSource(new Uint8Array([1, 2, 3, 4]));
  const segment = file.getSectionById(0x8538067);
  segment.data.push({ id: 0xf43b675, data: cluster });
  segment.updateByData();
  file.updateByData();
  return file.toBlob("audio/webm;codecs=opus");
};
const parse = async (blob) => new WebmFile(new Uint8Array(await blob.arrayBuffer()));
const info = (file) => file.getSectionById(0x8538067).getSectionById(0x549a966);
test("WebM duration is finalized in milliseconds without changing codec, tags or audio packets", async () => {
  const blob = source();
  const original = await parse(blob);
  const finalized = await finalizeNarrationAudio(blob, 6.48);
  const fixed = await parse(finalized);
  assert.equal(info(original).getSectionById(0x489), null);
  assert.equal(info(fixed).getSectionById(0x489).getValue(), 6480);
  assert.equal(info(fixed).getSectionById(0xad7b1).getValue(), 1000000);
  for (const section of [0x654ae6b, 0xf43b675]) {
    assert.deepEqual(
      fixed.getSectionById(0x8538067).getSectionById(section).source,
      original.getSectionById(0x8538067).getSectionById(section).source
    );
  }
  for (const section of [0xd80, 0x1741]) {
    assert.deepEqual(info(fixed).getSectionById(section).source, info(original).getSectionById(section).source);
  }
  assert.equal(finalized.type, blob.type);
});
test("a previously finalized WebM is returned unchanged, even when editor duration is trimmed", async () => {
  const blob = await finalizeNarrationAudio(source(), 6.48);
  assert.equal(await finalizeNarrationAudio(blob, 2), blob);
  assert.equal(await finalizeNarrationAudio(blob, NaN), blob);
});
test("legacy download uses full source duration, not trimmed duration or video end time", async () => {
  const clip = { startTime: 14.23, endTime: 18.71, audio: { sourceDuration: 6.48, trimStart: 1, trimEnd: 1 } };
  const blob = await finalizeNarrationAudio(source(), narrationAudio(clip).sourceDuration);
  assert.equal(
    info(await parse(blob))
      .getSectionById(0x489)
      .getValue(),
    6480
  );
  assert.ok(Math.abs(clip.endTime - clip.startTime - 4.48) < 0.001);
});
test("Ogg and MP4 recordings retain their browser-finalized containers", async () => {
  for (const type of ["audio/ogg;codecs=opus", "audio/mp4"]) {
    const blob = new Blob(["audio"], { type });
    assert.equal(await finalizeNarrationAudio(blob, 6.48), blob);
  }
});
test("empty, malformed, and unknown-duration WebM fail instead of exporting broken metadata", async () => {
  await assert.rejects(finalizeNarrationAudio(new Blob(), 2), /No audio/);
  await assert.rejects(finalizeNarrationAudio(new Blob(["not webm"], { type: "audio/webm" }), 2));
  for (const duration of [0, -1, NaN, Infinity]) {
    await assert.rejects(finalizeNarrationAudio(source(), duration), /duration is unavailable/);
  }
});
test("unsupported timecode scales are never silently rewritten", async () => {
  const file = await parse(source());
  const metadata = info(file);
  metadata.getSectionById(0xad7b1).setValue(100000);
  metadata.updateByData();
  file.getSectionById(0x8538067).updateByData();
  file.updateByData();
  await assert.rejects(finalizeNarrationAudio(file.toBlob("audio/webm"), 2), /unsupported WebM timing/);
});
test("indexed WebM without duration is rejected instead of invalidating seek offsets", async () => {
  const file = await parse(source());
  const segment = file.getSectionById(0x8538067);
  const cues = new WebmBase("Cues");
  cues.setSource(new Uint8Array());
  segment.data.push({ id: 0xc53bb6b, data: cues });
  segment.updateByData();
  file.updateByData();
  await assert.rejects(finalizeNarrationAudio(file.toBlob("audio/webm"), 2), /indexed WebM/);
});

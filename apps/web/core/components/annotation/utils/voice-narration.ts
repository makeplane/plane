import type { TCustomPlaylistAnnotation } from "../types/annotation.types";

export const MIN_NARRATION_SECONDS = 0.1;
// Allow scheduling jitter while distinguishing seeks from HLS source-timestamp jumps.
export const isNarrationTimeDiscontinuous = (start: number, elapsed: number, current: number, playVideo: boolean) =>
  !Number.isFinite(current) || Math.abs(current - (start + (playVideo ? elapsed : 0))) > 0.3;
export const MAX_NARRATION_BYTES = 100 * 1024 * 1024;
export const NARRATION_PEAK_COUNT = 512;
export const narrationDownloadRequest = (
  source: string,
  origin: string
): { url: string; credentials: "omit" | "same-origin" } => {
  if (!source.trim()) throw new Error("Missing narration audio");
  const url = new URL(source, origin);
  if (url.username || url.password) throw new Error("Unsupported narration audio URL");
  if (url.protocol === "data:" && source.startsWith("data:audio/")) {
    return { url: source, credentials: "omit" };
  }
  if (url.protocol === "blob:" && url.origin === origin) return { url: source, credentials: "omit" };
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported narration audio URL");
  if (url.origin === origin) return { url: source, credentials: "same-origin" };
  // Reuse the existing host-checked media proxy without forwarding session cookies to static storage.
  return { url: `/api/hls/?url=${encodeURIComponent(url.href)}`, credentials: "omit" };
};
const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
export const bound = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const narrationTime = (seconds: number, precise = true) => {
  const ms = Math.max(0, Math.round(finite(seconds, 0) * 1000));
  const parts = [Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60];
  if (ms >= 3600000) parts.unshift(Math.floor(ms / 3600000));
  return (
    parts.map((part) => String(part).padStart(2, "0")).join(":") +
    (precise ? `.${String(ms % 1000).padStart(3, "0")}` : "")
  );
};

export const normalizeNarrationAudio = (
  value: unknown,
  duration: number
): NonNullable<TCustomPlaylistAnnotation["audio"]> => {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const sourceDuration = Math.max(MIN_NARRATION_SECONDS, finite(raw.sourceDuration, duration));
  const trimStart = bound(finite(raw.trimStart, 0), 0, sourceDuration - MIN_NARRATION_SECONDS);
  const trimEnd = bound(finite(raw.trimEnd, 0), 0, sourceDuration - trimStart - MIN_NARRATION_SECONDS);
  const renderedDuration = sourceDuration - trimStart - trimEnd;
  return {
    sourceDuration,
    trimStart,
    trimEnd,
    volume: bound(finite(raw.volume, 1), 0, 1),
    // Old narrations retain their original unducked playback.
    ducking: raw.ducking == null ? null : bound(finite(raw.ducking, 0.35), 0, 1),
    fadeIn: bound(finite(raw.fadeIn, 0), 0, renderedDuration / 2),
    fadeOut: bound(finite(raw.fadeOut, 0), 0, renderedDuration / 2),
    peaks: Array.isArray(raw.peaks)
      ? raw.peaks.slice(0, NARRATION_PEAK_COUNT).map((peak) => bound(finite(peak, 0), 0, 1))
      : undefined,
  };
};
export const narrationAudio = (clip: TCustomPlaylistAnnotation) =>
  normalizeNarrationAudio(clip.audio, clip.endTime - clip.startTime);
export const overlapsNarration = (
  a: Pick<TCustomPlaylistAnnotation, "startTime" | "endTime">,
  b: Pick<TCustomPlaylistAnnotation, "startTime" | "endTime">
) =>
  Math.round(a.startTime * 1000) < Math.round(b.endTime * 1000) &&
  Math.round(b.startTime * 1000) < Math.round(a.endTime * 1000);
export const narrationOverlaps = (
  clip: TCustomPlaylistAnnotation,
  clips: TCustomPlaylistAnnotation[],
  excludeId?: string | null
) =>
  clips.filter(
    (other) =>
      other.type === "audio" && other.id !== clip.id && other.id !== excludeId && overlapsNarration(clip, other)
  );

export const trimNarration = (
  clip: TCustomPlaylistAnnotation,
  edge: "start" | "end",
  time: number
): TCustomPlaylistAnnotation => {
  if (!Number.isFinite(time)) return clip;
  const audio = narrationAudio(clip);
  if (edge === "start") {
    const startTime = bound(time, Math.max(0, clip.startTime - audio.trimStart), clip.endTime - MIN_NARRATION_SECONDS);
    const nextAudio = normalizeNarrationAudio({ ...audio, trimStart: audio.trimStart + startTime - clip.startTime }, 0);
    return { ...clip, startTime, audio: nextAudio };
  }
  const endTime = bound(time, clip.startTime + MIN_NARRATION_SECONDS, clip.endTime + audio.trimEnd);
  return {
    ...clip,
    endTime,
    audio: normalizeNarrationAudio({ ...audio, trimEnd: audio.trimEnd + clip.endTime - endTime }, 0),
  };
};
export const moveNarration = (clip: TCustomPlaylistAnnotation, time: number, duration: number) => {
  if (!Number.isFinite(time) || !Number.isFinite(duration)) return clip;
  const length = clip.endTime - clip.startTime;
  const startTime = bound(time, 0, Math.max(0, duration - length));
  return { ...clip, startTime, endTime: startTime + length };
};
export const narrationGain = (clip: TCustomPlaylistAnnotation, time: number) => {
  if (time < clip.startTime || time >= clip.endTime) return 0;
  const audio = clip.audio ?? narrationAudio(clip);
  const attack = audio.fadeIn ? bound((time - clip.startTime) / audio.fadeIn, 0, 1) : 1;
  const release = audio.fadeOut ? bound((clip.endTime - time) / audio.fadeOut, 0, 1) : 1;
  return audio.volume * Math.min(attack, release);
};
export const narrationLanes = (clips: TCustomPlaylistAnnotation[]) => {
  const lanes: TCustomPlaylistAnnotation[][] = [];
  for (const clip of [...clips].sort((a, b) => a.startTime - b.startTime)) {
    const index = lanes.findIndex((lane) => lane.every((other) => !overlapsNarration(other, clip)));
    if (index < 0) lanes.push([clip]);
    else lanes[index].push(clip);
  }
  return lanes;
};
export const sampleNarrationPeaks = (channels: Float32Array[], count = NARRATION_PEAK_COUNT) => {
  const length = channels[0]?.length ?? 0;
  count = Math.min(count, length);
  return Array.from({ length: Math.min(count, length) }, (_, index) => {
    let peak = 0;
    const start = Math.floor((index * length) / count);
    const end = Math.min(length, Math.ceil(((index + 1) * length) / count));
    for (const channel of channels)
      for (let sample = start; sample < end; sample++) peak = Math.max(peak, Math.abs(channel[sample]));
    return Math.round(bound(peak, 0, 1) * 1000) / 1000;
  });
};
export const narrationMicrophoneError = (error: unknown) => {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access is required. Allow access in your browser's site settings, then try again.";
  if (name === "NotFoundError") return "No microphone was detected. Connect a microphone and try again.";
  if (name === "OverconstrainedError")
    return "The selected microphone is no longer available. Choose another microphone.";
  if (name === "NotReadableError")
    return "The microphone is busy or unavailable. Check other applications and try again.";
  return error instanceof Error ? error.message : "Unable to access the microphone. Try again.";
};

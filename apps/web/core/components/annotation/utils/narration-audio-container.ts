import { fixParsedWebmDuration } from "@fix-webm-duration/fix";
import { WebmContainer, WebmFile } from "@fix-webm-duration/parser";
import { MAX_NARRATION_BYTES } from "./voice-narration";

// MediaRecorder emits streaming WebM without a duration. Finalize only the
// container; source audio, codec information, and non-destructive edits stay intact.
export const finalizeNarrationAudio = async (blob: Blob, sourceDuration: number): Promise<Blob> => {
  if (!blob.size) throw new Error("No audio was recorded. Check your microphone and try again.");
  if (blob.size > MAX_NARRATION_BYTES) throw new Error("The narration exceeds the 100 MB audio limit.");
  if (!/^(audio|video)\/webm(?:;|$)/i.test(blob.type)) return blob;

  const file = new WebmFile(new Uint8Array(await blob.arrayBuffer()));
  const segment = file.getSectionById(0x8538067);
  const info = segment?.getSectionById(0x549a966);
  const duration = info?.getSectionById(0x489)?.getValue();
  if (duration !== undefined && Number.isFinite(duration) && duration > 0) return blob;
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0)
    throw new Error("The narration duration is unavailable. Try downloading it again.");
  // The fixer uses millisecond timecodes, as emitted by browser MediaRecorder.
  // Do not rescale an unrelated file's timestamps or invalidate existing indexes.
  if (!segment || info?.getSectionById(0xad7b1)?.getValue() !== 1000000)
    throw new Error("The narration has unsupported WebM timing metadata.");
  if (segment.getSectionById(0x14d9b74) || segment.getSectionById(0xc53bb6b))
    throw new Error("Unable to finalize an indexed WebM without duration metadata.");
  // Cluster payloads are opaque in this parser. Keep them unknown-sized so
  // subsequent streaming clusters are not accidentally enclosed in a finite one.
  segment.data = segment.data?.map((section) => {
    // Unknown IDs are retained at runtime but excluded from the parser's ID union.
    const sectionId: number = section.id;
    if (sectionId !== 0xf43b675) return section;
    const cluster = new WebmContainer("Cluster", true);
    cluster.source = section.data.source;
    return { ...section, data: cluster };
  });
  if (!fixParsedWebmDuration(file, sourceDuration * 1000, { logger: false }))
    throw new Error("Unable to finalize the narration audio metadata.");
  return file.toBlob(blob.type);
};

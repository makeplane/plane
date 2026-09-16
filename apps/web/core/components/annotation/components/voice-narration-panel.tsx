"use client";
import { Mic, Play, RefreshCw, Square, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Checkbox, CustomSelect } from "@plane/ui";
import type { VoiceNarrationControls } from "../hooks/use-video-annotation-voice-narration";
import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { narrationAudio, narrationTime, trimNarration, moveNarration } from "../utils/voice-narration";
import { narrationRecordingLabel } from "../utils/voice-recorder";
import { MicrophoneInputMeter } from "./microphone-input-meter";
import { VoiceNarrationWaveform } from "./voice-narration-waveform";

type Props = {
  controls: VoiceNarrationControls;
  selected: TCustomPlaylistAnnotation | null;
  draft: TCustomPlaylistAnnotation | null;
  currentTime: number;
  duration: number;
  previewId: string | null;
  previewError: string | null;
  dirty: boolean;
  disabled: boolean;
  onChange: (clip: TCustomPlaylistAnnotation) => void;
  onReplace: (clip: TCustomPlaylistAnnotation) => void;
  onDelete: (id: string) => void;
  onPreview: (clip: TCustomPlaylistAnnotation) => void;
  onNew: () => void;
};

export const VoiceNarrationPanel = ({
  controls,
  selected,
  draft,
  currentTime,
  duration,
  previewId,
  previewError,
  dirty,
  disabled,
  onChange,
  onReplace,
  onDelete,
  onPreview,
  onNew,
}: Props) => {
  const { recorder, state, locked } = controls;
  const clip = selected;
  const audio = clip ? narrationAudio(clip) : null;
  const changeAudio = (key: "volume" | "ducking" | "fadeIn" | "fadeOut", value: number | null) => {
    if (clip && audio) onChange({ ...clip, audio: { ...audio, [key]: value } });
  };
  const showInspector = clip && audio && state.stage === "idle";
  return (
    <section
      data-narration-controls
      aria-label="Voice narration properties"
      className="flex w-full min-w-0 flex-col gap-4 overflow-y-auto p-2 text-xs text-custom-text-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-custom-border-200 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-custom-text-100">
          <Mic className="size-4 text-custom-primary-100" />
          Voice narration
        </h2>
        {dirty ? <span className="text-xs text-custom-text-300">Unsaved</span> : null}
      </div>
      {previewError ? (
        <p role="alert" className="text-xs leading-relaxed text-red-500">
          {previewError}
        </p>
      ) : null}
      {showInspector ? (
        <>
          {state.warning ? (
            <p role="status" className="text-custom-text-300">
              {state.warning}
            </p>
          ) : null}
          <label className="space-y-1.5">
            <span>Name</span>
            <Input
              aria-label="Narration name"
              value={clip.title ?? ""}
              maxLength={120}
              disabled={disabled}
              onChange={(event) => onChange({ ...clip, title: event.target.value })}
              className="w-full text-xs"
            />
          </label>
          <VoiceNarrationWaveform clip={clip} />
          <p className="font-mono text-xs tabular-nums">
            {narrationTime(clip.startTime)} → {narrationTime(clip.endTime)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="neutral-primary"
              onClick={() => onPreview(clip)}
              prependIcon={previewId === clip.id ? <Square /> : <Play />}
            >
              {previewId === clip.id ? "Stop preview" : "Play"}
            </Button>
            <Button
              size="sm"
              variant="neutral-primary"
              disabled={disabled}
              onClick={() => onReplace(clip)}
              prependIcon={<RefreshCw />}
            >
              Replace
            </Button>
          </div>
          <fieldset disabled={disabled} className="space-y-4 border-t border-custom-border-200 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span>Starts at (sec)</span>
                <Input
                  type="number"
                  aria-label="Narration start in seconds"
                  min={0}
                  max={Math.max(0, duration - (clip.endTime - clip.startTime))}
                  step={0.01}
                  value={Number(clip.startTime.toFixed(3))}
                  onChange={(event) => {
                    if (event.target.value !== "") onChange(moveNarration(clip, Number(event.target.value), duration));
                  }}
                  className="w-full"
                />
              </label>
              <div className="space-y-1">
                <span>Duration</span>
                <p className="py-2 font-mono tabular-nums text-custom-text-100">
                  {(clip.endTime - clip.startTime).toFixed(2)} sec
                </p>
              </div>
              <label className="space-y-1">
                <span>Trim start (sec)</span>
                <Input
                  type="number"
                  aria-label="Trim start in seconds"
                  min={0}
                  step={0.01}
                  max={audio.sourceDuration - audio.trimEnd - 0.1}
                  value={Number(audio.trimStart.toFixed(3))}
                  onChange={(event) => {
                    if (event.target.value !== "")
                      onChange(
                        trimNarration(clip, "start", clip.startTime + Number(event.target.value) - audio.trimStart)
                      );
                  }}
                  className="w-full"
                />
              </label>
              <label className="space-y-1">
                <span>Trim end (sec)</span>
                <Input
                  type="number"
                  aria-label="Trim end in seconds"
                  min={0}
                  step={0.01}
                  max={audio.sourceDuration - audio.trimStart - 0.1}
                  value={Number(audio.trimEnd.toFixed(3))}
                  onChange={(event) => {
                    if (event.target.value !== "")
                      onChange(
                        trimNarration(
                          clip,
                          "end",
                          Math.min(duration, clip.endTime + audio.trimEnd - Number(event.target.value))
                        )
                      );
                  }}
                  className="w-full"
                />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="flex justify-between">
                Narration volume <span>{Math.round(audio.volume * 100)}%</span>
              </span>
              <input
                aria-label="Narration volume"
                type="range"
                min={0}
                max={100}
                value={audio.volume * 100}
                onChange={(event) => changeAudio("volume", Number(event.target.value) / 100)}
                className="h-6 w-full accent-custom-primary-100"
              />
            </label>
            <label className="flex items-start gap-2">
              <Checkbox
                checked={audio.ducking !== null}
                onChange={(event) => changeAudio("ducking", event.target.checked ? 0.35 : null)}
              />
              <span>Lower video audio during narration</span>
            </label>
            {audio.ducking !== null ? (
              <label className="block space-y-2">
                <span className="flex justify-between">
                  Video audio <span>{Math.round(audio.ducking * 100)}%</span>
                </span>
                <input
                  aria-label="Video audio during narration"
                  type="range"
                  min={0}
                  max={100}
                  value={audio.ducking * 100}
                  onChange={(event) => changeAudio("ducking", Number(event.target.value) / 100)}
                  className="h-6 w-full accent-custom-primary-100"
                />
              </label>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {(["fadeIn", "fadeOut"] as const).map((key) => (
                <label key={key} className="space-y-1">
                  <span>{key === "fadeIn" ? "Fade in (sec)" : "Fade out (sec)"}</span>
                  <Input
                    aria-label={key === "fadeIn" ? "Fade in seconds" : "Fade out seconds"}
                    type="number"
                    min={0}
                    step={0.1}
                    max={(clip.endTime - clip.startTime) / 2}
                    value={audio[key]}
                    onChange={(event) => changeAudio(key, Number(event.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="link-danger" prependIcon={<Trash2 />} onClick={() => onDelete(clip.id)}>
                Delete narration
              </Button>
              <Button size="sm" variant="neutral-primary" prependIcon={<Mic />} onClick={onNew}>
                New narration
              </Button>
            </div>
          </fieldset>
        </>
      ) : draft ? (
        <p role="status" className="text-custom-text-300">
          Adding narration...
        </p>
      ) : (
        <>
          {controls.replacement ? (
            <p className="text-custom-text-300">
              Replacing narration at {narrationTime(controls.replacement.startTime)}
            </p>
          ) : null}
          <label className="space-y-2">
            <span>Microphone</span>
            <CustomSelect
              value={controls.deviceId}
              onChange={(value: string) => {
                controls.setDeviceId(value);
                void controls.prepare(value);
              }}
              disabled={locked || state.stage === "preparing" || !controls.supported}
              className="w-full"
              buttonClassName="w-full min-h-9"
              label={
                <span className="min-w-0 truncate">
                  {controls.devices.find((device) => device.deviceId === controls.deviceId)?.label ||
                    "Default microphone"}
                </span>
              }
            >
              <CustomSelect.Option value="">Default microphone</CustomSelect.Option>
              {controls.devices.map((device, index) => (
                <CustomSelect.Option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </label>
          <div className="space-y-2">
            <span>Input level</span>
            <MicrophoneInputMeter analyser={recorder.analyser} />
          </div>
          {state.error || !controls.supported ? (
            <p role="alert" className="leading-relaxed text-red-500">
              {state.error || "Microphone recording requires HTTPS or localhost."}
            </p>
          ) : null}
          {["idle", "error", "preparing"].includes(state.stage) ? (
            <Button
              size="sm"
              variant="neutral-primary"
              onClick={() => void controls.prepare()}
              loading={state.stage === "preparing"}
              prependIcon={<Mic />}
            >
              Check microphone
            </Button>
          ) : null}
          <div className="space-y-1 border-t border-custom-border-200 pt-3">
            <span>Starts at</span>
            <p className="font-mono text-base tabular-nums text-custom-text-100">
              {narrationTime(state.startTime ?? controls.replacement?.startTime ?? currentTime)}
            </p>
          </div>
          <fieldset disabled={locked || disabled} className="space-y-3">
            <label className="flex items-start gap-2">
              <Checkbox
                checked={controls.playVideo}
                onChange={(event) => controls.setPlayVideo(event.target.checked)}
              />
              <span>Play video while recording</span>
            </label>
            <label className="flex items-start gap-2">
              <Checkbox
                checked={controls.ducking !== null}
                onChange={(event) => controls.setDucking(event.target.checked ? 0.35 : null)}
              />
              <span>Lower video audio during narration</span>
            </label>
            <label className="flex items-start gap-2">
              <Checkbox
                checked={controls.countdown}
                onChange={(event) => controls.setCountdown(event.target.checked)}
              />
              <span>3-second countdown</span>
            </label>
          </fieldset>
          {locked ? (
            <p role="status" className="font-medium text-custom-text-100">
              {narrationRecordingLabel(state)}
            </p>
          ) : (
            <Button
              size="sm"
              disabled={state.stage !== "ready" || disabled}
              onClick={controls.start}
              prependIcon={<Mic />}
            >
              Start recording
            </Button>
          )}
          <p className="text-custom-text-400">Up to 30 minutes per take</p>
          {controls.replacement && !locked ? (
            <Button
              variant="link-neutral"
              size="sm"
              onClick={() => {
                recorder.cancel();
                controls.setReplacement(null);
              }}
            >
              Cancel replacement
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
};

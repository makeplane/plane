import { finalizeNarrationAudio } from "./narration-audio-container";
import {
  MAX_NARRATION_BYTES,
  MIN_NARRATION_SECONDS,
  narrationMicrophoneError,
  sampleNarrationPeaks,
} from "./voice-narration";

export type NarrationStage =
  | "idle"
  | "preparing"
  | "ready"
  | "countdown"
  | "starting"
  | "recording"
  | "paused"
  | "processing"
  | "review"
  | "error";
export type NarrationTake = {
  content: string;
  mimeType: string;
  fileSize: number;
  sourceDuration: number;
  startTime: number;
  peaks?: number[];
};
export type RecorderSnapshot = {
  stage: NarrationStage;
  startTime?: number;
  countdown?: number;
  error?: string;
  take?: NarrationTake;
  warning?: string;
  stopReason?: "manual" | "video-ended";
};
export const narrationRecordingLabel = (state: RecorderSnapshot) => {
  switch (state.stage) {
    case "countdown":
      return `Get ready... ${state.countdown}`;
    case "starting":
      return "Starting narration...";
    case "recording":
      return "Recording narration";
    case "paused":
      return "Narration paused";
    case "processing":
      return "Preparing narration...";
    default:
      return "Voice narration";
  }
};
export const isNarrationLocked = (stage: NarrationStage) =>
  ["countdown", "starting", "recording", "paused", "processing"].includes(stage);
export const NARRATION_MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
export const MAX_NARRATION_SECONDS = 30 * 60;
type StartOptions = {
  countdown: boolean;
  startTime: number;
  playVideo: boolean;
  getTime: () => number;
  play: () => void | Promise<void>;
  pause: () => void;
};
export type RecorderEnvironment = {
  getStream: (deviceId: string) => Promise<MediaStream>;
  createContext: () => AudioContext;
  createRecorder: (stream: MediaStream) => MediaRecorder;
  finalizeBlob: (blob: Blob, sourceDuration: number) => Promise<Blob>;
  readBlob: (blob: Blob) => Promise<string>;
};
const browserEnvironment: RecorderEnvironment = {
  getStream: (deviceId) =>
    navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }),
  createContext: () => new AudioContext(),
  createRecorder: (stream) => {
    const mimeType = NARRATION_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    return new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64000 });
  },
  finalizeBlob: finalizeNarrationAudio,
  readBlob: (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to prepare the audio for saving."));
      reader.readAsDataURL(blob);
    }),
};

// Publishes lifecycle changes only; meters and timers read browser resources directly.
export class VoiceRecorder {
  private snapshot: RecorderSnapshot = { stage: "idle" };
  private listeners = new Set<() => void>();
  private generation = 0;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recorder: MediaRecorder | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private options: StartOptions | null = null;
  private accumulated = 0;
  private segmentStart: number | null = null;
  private endHandler: (() => void) | null = null;
  analyser: AnalyserNode | null = null;
  deviceId = "";
  private environment: RecorderEnvironment;
  constructor(environment: RecorderEnvironment = browserEnvironment) {
    this.environment = environment;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getElapsed = () =>
    this.accumulated +
    (this.segmentStart !== null && this.context ? Math.max(0, this.context.currentTime - this.segmentStart) : 0);
  private publish(snapshot: RecorderSnapshot) {
    const startTime = isNarrationLocked(snapshot.stage) ? this.options?.startTime : snapshot.take?.startTime;
    this.snapshot = { ...snapshot, ...(startTime === undefined ? {} : { startTime }) };
    this.listeners.forEach((listener) => listener());
  }
  private freezeClock() {
    this.accumulated = this.getElapsed();
    this.segmentStart = null;
  }
  private stopInput() {
    const endHandler = this.endHandler;
    if (endHandler) this.stream?.getTracks().forEach((track) => track.removeEventListener("ended", endHandler));
    this.endHandler = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.stream = null;
    this.source = null;
    this.analyser = null;
  }
  private releaseInput() {
    this.stopInput();
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => undefined);
    this.context = null;
  }
  private clearCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }
  fail = (message: string) => {
    this.abort();
    this.publish({ stage: "error", error: message });
  };
  prepare = async (deviceId = "") => {
    if (isNarrationLocked(this.snapshot.stage) || this.snapshot.stage === "review") return;
    const generation = ++this.generation;
    this.releaseInput();
    this.publish({ stage: "preparing" });
    try {
      const stream = await this.environment.getStream(deviceId);
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      this.deviceId = stream.getAudioTracks()[0]?.getSettings().deviceId || deviceId;
      this.context = this.environment.createContext();
      await this.context.resume();
      if (generation !== this.generation) return;
      this.source = this.context.createMediaStreamSource(stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.source.connect(this.analyser);
      this.endHandler = () =>
        this.fail("The selected microphone disconnected. Reconnect it or choose another microphone.");
      const endHandler = this.endHandler;
      stream.getAudioTracks().forEach((track) => track.addEventListener("ended", endHandler));
      this.publish({ stage: "ready" });
    } catch (error) {
      if (generation === this.generation) this.fail(narrationMicrophoneError(error));
    }
  };
  start = (options: StartOptions) => {
    if (this.snapshot.stage !== "ready" || !this.stream) return;
    this.options = options;
    this.accumulated = 0;
    this.segmentStart = null;
    options.pause();
    if (!options.countdown) {
      void this.begin();
      return;
    }
    this.publish({ stage: "countdown", countdown: 3 });
    this.countdownTimer = setInterval(() => {
      const countdown = (this.snapshot.countdown ?? 1) - 1;
      if (countdown <= 0) {
        this.clearCountdown();
        void this.begin();
      } else this.publish({ stage: "countdown", countdown });
    }, 1000);
  };
  private async begin() {
    const options = this.options;
    const generation = this.generation;
    if (!options || !this.stream || !this.context) return;
    this.publish({ stage: "starting" });
    try {
      await this.context.resume();
      if (generation !== this.generation) return;
      if (options.playVideo) await options.play();
      if (generation !== this.generation || !this.stream || !this.context) return;
      // Capture the player clock after play() settles, never the countdown clock.
      const startTime = options.playVideo ? options.getTime() : options.startTime;
      options.startTime = startTime;
      const recorder = this.environment.createRecorder(this.stream);
      this.recorder = recorder;
      const chunks: Blob[] = [];
      let bytes = 0;
      recorder.addEventListener("dataavailable", (event) => {
        if (generation !== this.generation) return;
        if (event.data.size) {
          chunks.push(event.data);
          bytes += event.data.size;
        }
        if (bytes >= MAX_NARRATION_BYTES || this.getElapsed() >= MAX_NARRATION_SECONDS) this.stop();
      });
      recorder.addEventListener("error", () => {
        if (generation === this.generation)
          this.fail("Recording failed. Your existing narration has been kept. Try again.");
      });
      recorder.addEventListener("stop", () => {
        if (generation !== this.generation) return;
        this.freezeClock();
        options.pause();
        this.publish({ stage: "processing", stopReason: this.snapshot.stopReason });
        void this.process(chunks, recorder.mimeType, startTime, generation);
      });
      this.segmentStart = this.context.currentTime;
      recorder.start(250);
      this.publish({ stage: "recording" });
    } catch (error) {
      if (generation === this.generation) this.fail(narrationMicrophoneError(error));
    }
  }
  pause = () => {
    if (this.snapshot.stage !== "recording" || this.recorder?.state !== "recording") return;
    this.recorder.pause();
    this.freezeClock();
    this.publish({ stage: "paused" });
    this.options?.pause();
  };
  resume = async () => {
    if (this.snapshot.stage !== "paused" || !this.context) return;
    const generation = this.generation;
    this.publish({ stage: "starting" });
    try {
      await this.context.resume();
      if (generation !== this.generation) return;
      if (this.options?.playVideo) await this.options.play();
      if (generation !== this.generation || !this.context || this.recorder?.state !== "paused") return;
      this.segmentStart = this.context.currentTime;
      this.recorder.resume();
      this.publish({ stage: "recording" });
    } catch {
      if (generation === this.generation) this.fail("The video could not resume. Try recording again.");
    }
  };
  stop = () => this.finish("manual");
  stopAtVideoEnd = () => this.finish("video-ended");
  private finish(stopReason: "manual" | "video-ended") {
    if (!["recording", "paused"].includes(this.snapshot.stage) || !this.recorder || this.recorder.state === "inactive")
      return;
    this.freezeClock();
    this.publish({ stage: "processing", stopReason });
    this.options?.pause();
    this.recorder.stop();
  }
  private async process(chunks: Blob[], mimeType: string, startTime: number, generation: number) {
    const stopReason = this.snapshot.stopReason;
    this.stopInput();
    try {
      const blob = new Blob(chunks, { type: mimeType || chunks[0]?.type });
      if (!blob.size) throw new Error("No audio was recorded. Check your microphone and try again.");
      if (blob.size > MAX_NARRATION_BYTES)
        throw new Error("The recording exceeded the 100 MB audio limit. Record a shorter take.");
      if (this.accumulated < MIN_NARRATION_SECONDS)
        throw new Error("The recording was too short. Record at least a moment of commentary.");
      let sourceDuration = this.accumulated;
      let peaks: number[] | undefined;
      let warning: string | undefined;
      try {
        const buffer = await this.context?.decodeAudioData(await blob.arrayBuffer());
        if (buffer) {
          sourceDuration = buffer.duration;
          peaks = sampleNarrationPeaks(
            Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i))
          );
        }
      } catch {
        warning = "Waveform unavailable. You can still preview and save this narration.";
      }
      if (generation !== this.generation) return;
      if (sourceDuration < MIN_NARRATION_SECONDS) throw new Error("The recording was too short. Please try again.");
      const finalizedBlob = await this.environment.finalizeBlob(blob, sourceDuration);
      if (generation !== this.generation) return;
      const content = await this.environment.readBlob(finalizedBlob);
      if (generation !== this.generation) return;
      this.recorder = null;
      this.releaseInput();
      this.publish({
        stage: "review",
        take: { content, mimeType: finalizedBlob.type, fileSize: finalizedBlob.size, sourceDuration, startTime, peaks },
        warning,
        stopReason,
      });
    } catch (error) {
      if (generation === this.generation) this.fail(narrationMicrophoneError(error));
    }
  }
  private abort() {
    ++this.generation;
    this.clearCountdown();
    this.freezeClock();
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.recorder = null;
    this.options?.pause();
    this.options = null;
    this.releaseInput();
  }
  cancel = () => {
    this.abort();
    this.publish({ stage: "idle" });
  };
  finishReview = () => {
    if (this.snapshot.stage === "review") this.publish({ stage: "idle" });
  };
  dispose = () => {
    this.abort();
    this.snapshot = { stage: "idle" };
  };
}

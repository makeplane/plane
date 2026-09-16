import assert from "node:assert/strict";
import test from "node:test";
import "./register-types.mjs";
const { VoiceRecorder, isNarrationLocked } = await import("../voice-recorder.ts");
const flush = () => new Promise((resolve) => setImmediate(resolve));

const setup = (options = {}) => {
  const track = new EventTarget();
  track.stops = 0;
  track.stop = () => {
    track.stops++;
  };
  track.getSettings = () => ({ deviceId: "test-input" });
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const context = {
    currentTime: 0,
    state: "running",
    resume: async () => {},
    close: async () => {
      context.state = "closed";
    },
    createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
    createAnalyser: () => ({ disconnect() {} }),
    decodeAudioData: async () => {
      if (options.waveformFailure) throw new Error("decode");
      return {
        duration: options.duration ?? 2,
        numberOfChannels: 1,
        getChannelData: () => new Float32Array([0.2, 0.5]),
      };
    },
  };
  class FakeRecorder extends EventTarget {
    state = "inactive";
    mimeType = "audio/webm";
    start() {
      this.state = "recording";
    }
    pause() {
      this.state = "paused";
    }
    resume() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => {
        const event = new Event("dataavailable");
        event.data = new Blob(options.empty ? [] : ["audio"], { type: "audio/webm" });
        this.dispatchEvent(event);
        this.dispatchEvent(new Event("stop"));
      });
    }
  }
  const media = new FakeRecorder();
  const recorder = new VoiceRecorder({
    getStream: options.getStream ?? (async () => stream),
    createContext: () => context,
    createRecorder: () => media,
    finalizeBlob: options.finalizeBlob ?? (async (blob) => blob),
    readBlob:
      options.readBlob ??
      (async () => {
        if (options.readFailure) throw new Error("Unable to prepare audio");
        return "data:audio/webm;base64,YXVkaW8=";
      }),
  });
  const transitions = [];
  recorder.subscribe(() => transitions.push(recorder.getSnapshot().stage));
  let playing = false;
  const start = async (overrides = {}) => {
    recorder.start({
      countdown: false,
      startTime: 14.23,
      playVideo: true,
      getTime: () => 14.23,
      play: async () => {
        playing = true;
      },
      pause: () => {
        playing = false;
      },
      ...overrides,
    });
    await flush();
  };
  return { recorder, context, media, track, transitions, stream, start, isPlaying: () => playing };
};
test("prepare never records; start/stop processes a take into review", async () => {
  const f = setup();
  await f.recorder.prepare();
  assert.equal(f.media.state, "inactive");
  assert.equal(f.recorder.getSnapshot().stage, "ready");
  await f.start();
  f.context.currentTime = 2;
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "review");
  assert.equal(f.recorder.getSnapshot().take.startTime, 14.23);
  assert.equal(f.recorder.getSnapshot().take.sourceDuration, 2);
  assert.ok(f.recorder.getSnapshot().take.peaks.length);
  assert.equal(f.track.stops, 1);
  assert.equal(f.context.state, "closed");
  assert.equal(f.isPlaying(), false);
  f.recorder.finishReview();
  assert.equal(f.recorder.getSnapshot().stage, "idle");
});
test("processing finalizes source duration before preparing saved audio", async () => {
  const finalized = new Blob(["finalized audio"], { type: "audio/webm;codecs=opus" });
  let duration;
  let savedBlob;
  const f = setup({
    duration: 2.48,
    finalizeBlob: async (blob, sourceDuration) => {
      assert.equal(await blob.text(), "audio");
      duration = sourceDuration;
      return finalized;
    },
    readBlob: async (blob) => {
      savedBlob = blob;
      return "finalized-content";
    },
  });
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 3;
  f.recorder.stop();
  await flush();
  assert.equal(duration, 2.48);
  assert.equal(savedBlob, finalized);
  assert.equal(f.recorder.getSnapshot().take.content, "finalized-content");
  assert.equal(f.recorder.getSnapshot().take.fileSize, finalized.size);
  assert.equal(f.recorder.getSnapshot().take.mimeType, finalized.type);
});
test("cancelling during container finalization cannot publish or save a stale take", async () => {
  let finish;
  let saved = false;
  const f = setup({
    finalizeBlob: (blob) =>
      new Promise((resolve) => {
        finish = () => resolve(blob);
      }),
    readBlob: async () => {
      saved = true;
      return "stale";
    },
  });
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 2;
  f.recorder.stop();
  await flush();
  f.recorder.cancel();
  finish();
  await flush();
  assert.equal(saved, false);
  assert.deepEqual(f.recorder.getSnapshot(), { stage: "idle" });
  assert.equal(f.context.state, "closed");
});
test("container finalization failure releases resources without publishing a broken take", async () => {
  const f = setup({
    finalizeBlob: async () => {
      throw new Error("Unable to finalize narration");
    },
  });
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 2;
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "error");
  assert.equal(f.recorder.getSnapshot().take, undefined);
  assert.equal(f.track.stops, 1);
  assert.equal(f.context.state, "closed");
});
test("video-end stop reason survives processing and resets before the next take", async () => {
  const f = setup();
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 2;
  f.recorder.stopAtVideoEnd();
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "review");
  assert.equal(f.recorder.getSnapshot().stopReason, "video-ended");
  f.recorder.finishReview();
  assert.equal(f.recorder.getSnapshot().stopReason, undefined);
  f.recorder.dispose();
});
test("pause/resume excludes paused time and pauses the video", async () => {
  const f = setup();
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 2;
  f.recorder.pause();
  assert.equal(f.isPlaying(), false);
  f.context.currentTime = 12;
  assert.equal(f.recorder.getElapsed(), 2);
  await f.recorder.resume();
  assert.equal(f.isPlaying(), true);
  f.context.currentTime = 15;
  assert.equal(f.recorder.getElapsed(), 5);
  f.recorder.cancel();
});
test("cancel discards chunks and ignores the delayed stop event", async () => {
  const f = setup();
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 2;
  f.recorder.cancel();
  await flush();
  assert.deepEqual(f.recorder.getSnapshot(), { stage: "idle" });
  assert.equal(f.track.stops, 1);
});
test("countdown freezes its timestamp and can be cancelled", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const f = setup();
  await f.recorder.prepare();
  await f.start({ countdown: true });
  assert.equal(f.recorder.getSnapshot().stage, "countdown");
  assert.equal(f.isPlaying(), false);
  t.mock.timers.tick(3000);
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "recording");
  f.context.currentTime = 2;
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().take.startTime, 14.23);
  f.recorder.dispose();
});
test("denied access and missing devices produce error states", async () => {
  for (const name of ["NotAllowedError", "NotFoundError"]) {
    const f = setup({
      getStream: async () => {
        const error = new Error(name);
        error.name = name;
        throw error;
      },
    });
    await f.recorder.prepare();
    assert.equal(f.recorder.getSnapshot().stage, "error");
    assert.ok(f.recorder.getSnapshot().error);
  }
});
test("late microphone permission after unmount releases the acquired track", async () => {
  let resolve;
  const pending = new Promise((done) => {
    resolve = done;
  });
  const f = setup({ getStream: () => pending });
  const preparation = f.recorder.prepare();
  f.recorder.dispose();
  resolve(f.stream);
  await preparation;
  assert.equal(f.track.stops, 1);
  assert.equal(f.recorder.getSnapshot().stage, "idle");
});
test("disconnect during recording cancels the incomplete take", async () => {
  const f = setup();
  await f.recorder.prepare();
  await f.start();
  f.track.dispatchEvent(new Event("ended"));
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "error");
  assert.match(f.recorder.getSnapshot().error, /disconnected/);
  assert.equal(f.recorder.getSnapshot().take, undefined);
});
test("empty and very short recordings fail without creating a take", async () => {
  for (const options of [{ empty: true }, { duration: 0.01 }]) {
    const f = setup(options);
    await f.recorder.prepare();
    await f.start();
    f.context.currentTime = 2;
    f.recorder.stop();
    await flush();
    assert.equal(f.recorder.getSnapshot().stage, "error");
    assert.equal(f.recorder.getSnapshot().take, undefined);
    assert.equal(f.context.state, "closed");
  }
  const f = setup();
  await f.recorder.prepare();
  await f.start();
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "error");
});
test("waveform failure still preserves playable audio for review", async () => {
  const f = setup({ waveformFailure: true });
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 3;
  f.recorder.stop();
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "review");
  assert.equal(f.recorder.getSnapshot().take.sourceDuration, 3);
  assert.ok(f.recorder.getSnapshot().warning);
});
test("playback rejection and payload failure clean resources", async () => {
  const f = setup();
  await f.recorder.prepare();
  await f.start({
    play: async () => {
      throw new Error("Playback failed");
    },
  });
  assert.equal(f.recorder.getSnapshot().stage, "error");
  assert.equal(f.track.stops, 1);
  const g = setup({ readFailure: true });
  await g.recorder.prepare();
  await g.start();
  g.context.currentTime = 2;
  g.recorder.stop();
  await flush();
  assert.equal(g.recorder.getSnapshot().stage, "error");
  assert.equal(g.track.stops, 1);
});
test("invalid recording actions do not create impossible state combinations", async () => {
  const f = setup();
  f.recorder.stop();
  f.recorder.pause();
  await f.recorder.resume();
  assert.equal(f.recorder.getSnapshot().stage, "idle");
  await f.recorder.prepare();
  await f.start();
  await f.start();
  assert.equal(f.transitions.filter((stage) => stage === "recording").length, 1);
  assert.equal(isNarrationLocked("recording"), true);
  assert.equal(isNarrationLocked("review"), false);
  f.recorder.dispose();
});

test("a long take stops at the recording limit and remains reviewable", async () => {
  const f = setup({ duration: 1800 });
  await f.recorder.prepare();
  await f.start();
  f.context.currentTime = 1800;
  const event = new Event("dataavailable");
  event.data = new Blob(["audio"]);
  f.media.dispatchEvent(event);
  await flush();
  assert.equal(f.recorder.getSnapshot().stage, "review");
  assert.equal(f.recorder.getSnapshot().take.sourceDuration, 1800);
  assert.equal(f.track.stops, 1);
});

test("cancelling while video play is pending cannot start a recorder", async () => {
  const f = setup();
  await f.recorder.prepare();
  let finishPlay;
  await f.start({
    play: () =>
      new Promise((resolve) => {
        finishPlay = resolve;
      }),
  });
  f.recorder.cancel();
  finishPlay();
  await flush();
  assert.equal(f.media.state, "inactive");
  assert.equal(f.recorder.getSnapshot().stage, "idle");
  assert.equal(f.track.stops, 1);
});

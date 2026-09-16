import { StrictMode, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toast } from "@plane/propel/toast";
import type { TCustomPlaylistAnnotation } from "../../types/annotation.types";
import { VideoAnnotationEditor } from "../video-annotation-editor";

const initialAnnotations: TCustomPlaylistAnnotation[] = [];

function NarrationFixture() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  const [properties, setProperties] = useState<HTMLElement | null>(null);
  const [timeline, setTimeline] = useState<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveFails, setSaveFails] = useState(false);
  const [saved, setSaved] = useState(initialAnnotations);
  const [session, setSession] = useState(0);
  const [logicalEnd, setLogicalEnd] = useState(false);
  const save = useRef<(() => Promise<boolean>) | null>(null);
  const narrationExample = useRef<TCustomPlaylistAnnotation | null>(null);
  const registerSave = useCallback((handler: (() => Promise<boolean>) | null) => {
    save.current = handler;
  }, []);
  const [lastSaveResult, setLastSaveResult] = useState<boolean | null>(null);
  return (
    <main className="min-h-screen bg-custom-background-100 p-4 text-custom-text-100">
      <Toast theme="dark" />
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-base font-semibold">Video annotations</h1>
        <output data-testid="dirty">{dirty ? "Unsaved changes" : "Saved"}</output>
        <label>
          <input type="checkbox" checked={saveFails} onChange={(event) => setSaveFails(event.target.checked)} />
          Fail save
        </label>
        <button onClick={() => setSaved((clips) => [...clips])}>Refresh annotations</button>
        <button
          onClick={() => {
            if (!narrationExample.current) return;
            setSaved([{ ...narrationExample.current, title: "Legacy narration", content: "/legacy-narration.webm" }]);
            setSession((value) => value + 1);
          }}
        >
          Load legacy narration
        </button>
        <button
          onClick={() => {
            const drawings: TCustomPlaylistAnnotation[] = [
              {
                id: "guide-line",
                type: "line",
                content: "Guide line",
                title: "Draw moment",
                x: 10,
                y: 10,
                width: 100,
                height: 40,
                startTime: 14,
                endTime: 16,
              },
              {
                id: "movement-arrow",
                type: "arrow",
                content: "Movement arrow",
                title: "Draw moment",
                x: 30,
                y: 30,
                width: 100,
                height: 40,
                startTime: 14,
                endTime: 16,
              },
            ];
            setSaved(narrationExample.current ? [narrationExample.current, ...drawings] : drawings);
            setSession((value) => value + 1);
          }}
        >
          Load mixed layers
        </button>
        <label>
          <input type="checkbox" checked={logicalEnd} onChange={(event) => setLogicalEnd(event.target.checked)} />
          Logical timeline at end
        </label>
        <button
          onClick={() => {
            setSaved([]);
            setSession((value) => value + 1);
          }}
        >
          Switch media
        </button>
        <button disabled={locked} onClick={async () => setLastSaveResult((await save.current?.()) ?? false)}>
          Save editor
        </button>
        <output data-testid="save-result">{String(lastSaveResult)}</output>
      </header>
      <div className="flex flex-wrap items-start gap-3">
        <div ref={setToolbar} className="shrink-0" />
        <div className="relative min-w-0 flex-1 bg-black" style={{ minWidth: 220 }}>
          <video
            ref={setVideo}
            src="/fixture.mp4"
            controls={!locked}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="aspect-video w-full"
          />
          <VideoAnnotationEditor
            annotationKey={`browser-test-${session}`}
            annotations={saved}
            canEdit
            currentTime={logicalEnd ? 30 : currentTime}
            durationSeconds={30}
            videoElement={video}
            getCurrentTime={() => video?.currentTime ?? 0}
            isPlaying={playing}
            onRecordingLockChange={setLocked}
            onUnsavedChangesChange={setDirty}
            onRegisterSaveHandler={registerSave}
            onRequestPause={() => video?.pause()}
            onRequestPlay={() => video?.play()}
            onSeek={(time) => {
              if (video) video.currentTime = time;
              setCurrentTime(time);
            }}
            onSave={async (clips) => {
              if (saveFails) throw new Error("Simulated save failure");
              narrationExample.current = clips.find((clip) => clip.type === "audio") ?? narrationExample.current;
              setSaved(clips);
              return clips;
            }}
            showTimeline
            enableTextTool
            enableAnnotationTransforms
            toolbarHostElement={toolbar}
            propertyHostElement={properties}
            timelineHostElement={timeline}
          />
        </div>
        <aside ref={setProperties} className="w-full min-w-0 border border-custom-border-200 p-2 lg:w-[280px]" />
      </div>
      <div ref={setTimeline} className="mt-3 min-w-0" />
      <output data-testid="saved-json" hidden>
        {JSON.stringify(saved)}
      </output>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NarrationFixture />
  </StrictMode>
);

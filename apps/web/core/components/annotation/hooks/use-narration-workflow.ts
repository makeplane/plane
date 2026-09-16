import { useCallback, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import useKeypress from "@/hooks/use-keypress";
import type { TCustomPlaylistAnnotation, TCustomPlaylistAnnotationTool } from "../types/annotation.types";
import { createPlaylistAnnotationId } from "../utils/playlist-annotation-model";
import { normalizeNarrationAudio } from "../utils/voice-narration";
import { useNarrationPreview } from "./use-narration-preview";
import type { VoiceNarrationControls } from "./use-video-annotation-voice-narration";

type Params = {
  controls: VoiceNarrationControls;
  annotations: TCustomPlaylistAnnotation[];
  setAnnotations: Dispatch<SetStateAction<TCustomPlaylistAnnotation[]>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setTool: Dispatch<SetStateAction<TCustomPlaylistAnnotationTool>>;
  tool: TCustomPlaylistAnnotationTool;
  duration: number;
  canEdit: boolean;
  saving: boolean;
  dirty: boolean;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  isPlaying: boolean;
  onError: (message: string) => void;
};
export const useNarrationWorkflow = ({
  controls,
  annotations,
  setAnnotations,
  setSelectedId,
  setTool,
  tool,
  duration,
  canEdit,
  saving,
  dirty,
  onPause,
  onSeek,
  isPlaying,
  onError,
}: Params) => {
  const { recorder, state, locked, replacement, setReplacement } = controls;
  const preview = useNarrationPreview(onPause);
  const { stop: stopPreview } = preview;
  const { prepare } = controls;
  const draft = useMemo<TCustomPlaylistAnnotation | null>(() => {
    const take = state.take;
    if (!take) return null;
    const renderedDuration = Math.min(take.sourceDuration, Math.max(0.1, duration - take.startTime));
    return {
      ...take,
      id: createPlaylistAnnotationId(),
      title: "New narration",
      type: "audio",
      createdAt: new Date().toISOString(),
      x: 0,
      y: 0,
      endTime: take.startTime + renderedDuration,
      audio: {
        sourceDuration: take.sourceDuration,
        trimStart: 0,
        trimEnd: take.sourceDuration - renderedDuration,
        volume: 1,
        ducking: controls.ducking,
        fadeIn: Math.min(0.15, renderedDuration / 2),
        fadeOut: Math.min(0.15, renderedDuration / 2),
        peaks: take.peaks,
      },
    };
  }, [state.take, controls.ducking, duration]);
  useEffect(() => {
    if (draft) {
      setSelectedId(draft.id);
      setTool("audio");
    }
  }, [draft, setSelectedId, setTool]);
  useEffect(() => {
    if (isPlaying) stopPreview();
  }, [isPlaying, stopPreview]);
  const commit = useCallback(
    (clip: TCustomPlaylistAnnotation) => {
      stopPreview();
      const next = { ...clip, audio: normalizeNarrationAudio(clip.audio, clip.endTime - clip.startTime) };
      setAnnotations((current) => [...current.filter((item) => item.id !== next.id), next]);
      setSelectedId(next.id);
      setTool("audio");
      if (state.stage === "review") {
        recorder.finishReview();
        setReplacement(null);
      }
    },
    [stopPreview, recorder, setAnnotations, setReplacement, setSelectedId, setTool, state.stage]
  );
  const change = useCallback(
    (clip: TCustomPlaylistAnnotation) => {
      if (!canEdit || locked || saving || state.stage === "review") return;
      commit(clip);
    },
    [canEdit, commit, locked, saving, state.stage]
  );
  const accept = useCallback(() => {
    if (!draft) return;
    const original = annotations.find((clip) => clip.id === replacement?.id);
    const clip = {
      ...draft,
      id: original?.id ?? draft.id,
      title:
        original?.title ||
        `Narration ${String(annotations.filter((item) => item.type === "audio").length + 1).padStart(2, "0")}`,
    };
    commit(clip);
  }, [annotations, commit, draft, replacement?.id]);
  useEffect(() => {
    // Stop is the commit intent; overlapping recordings are retained automatically.
    if (state.stage === "review" && draft) accept();
  }, [accept, draft, state.stage]);
  const select = useCallback(
    (clip: TCustomPlaylistAnnotation) => {
      if (locked || saving || state.stage === "review") return;
      stopPreview();
      recorder.cancel();
      setReplacement(null);
      setTool("audio");
      setSelectedId(clip.id);
      onPause?.();
      onSeek?.(clip.startTime);
    },
    [locked, onPause, onSeek, recorder, saving, setReplacement, setSelectedId, setTool, state.stage, stopPreview]
  );
  const open = useCallback(() => {
    if (locked || saving || state.stage === "review") return;
    stopPreview();
    setReplacement(null);
    setSelectedId(null);
    setTool("audio");
    onPause?.();
    void prepare();
  }, [prepare, locked, onPause, stopPreview, saving, setReplacement, setSelectedId, setTool, state.stage]);
  const replace = useCallback(
    (clip: TCustomPlaylistAnnotation) => {
      if (locked || saving) return;
      stopPreview();
      recorder.cancel();
      setReplacement({ id: replacement?.id ?? (draft?.id === clip.id ? "" : clip.id), startTime: clip.startTime });
      setSelectedId(null);
      setTool("audio");
      onPause?.();
      onSeek?.(clip.startTime);
      void prepare();
    },
    [
      prepare,
      draft?.id,
      locked,
      onPause,
      onSeek,
      stopPreview,
      recorder,
      replacement?.id,
      saving,
      setReplacement,
      setSelectedId,
      setTool,
    ]
  );
  const duplicate = useCallback(
    (clip: TCustomPlaylistAnnotation) =>
      change({ ...clip, id: createPlaylistAnnotationId(), title: `${clip.title || "Narration"} copy` }),
    [change]
  );
  const editableTarget = (event: KeyboardEvent) =>
    event.target instanceof HTMLElement &&
    Boolean(event.target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]'));
  useKeypress("R", (event) => {
    if (!canEdit || saving || !event.shiftKey || event.repeat || editableTarget(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (["recording", "paused"].includes(state.stage)) recorder.stop();
    else if (tool === "audio" && state.stage === "ready") controls.start();
    else open();
  });
  useKeypress(" ", (event) => {
    if (
      !canEdit ||
      !locked ||
      editableTarget(event) ||
      (event.target instanceof HTMLElement && event.target.closest("button"))
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    if (state.stage === "recording") recorder.pause();
    else if (state.stage === "paused") void recorder.resume();
  });
  useKeypress("Escape", (event) => {
    if (!canEdit || tool !== "audio" || editableTarget(event)) return;
    event.preventDefault();
    stopPreview();
    recorder.cancel();
    setReplacement(null);
    if (!locked && state.stage !== "review") {
      setTool("pen");
      setSelectedId(null);
    }
  });
  useEffect(() => {
    if (!canEdit) return;
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || locked || draft) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: MouseEvent) => {
      if (!locked) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (anchor && !anchor.hasAttribute("download") && anchor.getAttribute("target") !== "_blank") {
        event.preventDefault();
        event.stopPropagation();
        onError("Stop recording before leaving this page.");
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [canEdit, dirty, draft, locked, onError]);
  useEffect(() => {
    if (!canEdit) recorder.cancel();
  }, [canEdit, recorder]);
  // Entering a drawing tool releases the preparation microphone.
  useEffect(() => {
    if (tool !== "audio" && !locked) recorder.cancel();
  }, [locked, recorder, tool]);
  return {
    draft,
    change,
    select,
    open,
    replace,
    duplicate,
    preview,
    needsReview: state.stage === "review",
  };
};

import type { TCustomPlaylistAnnotation } from "./annotation.types";

export type VideoAnnotationEditorProps = {
  annotationKey: string;
  annotations: TCustomPlaylistAnnotation[] | unknown;
  autoEnableAnnotationModeKey?: number | string;
  canEdit: boolean;
  className?: string;
  currentTime: number;
  durationSeconds?: number | null;
  enableAnnotationTransforms?: boolean;
  enableTextTool?: boolean;
  fitToVideoBounds?: boolean;
  isPlaying?: boolean;
  modeResetKey?: number | string;
  onModeChange?: (enabled: boolean) => void;
  onRequestPause?: () => void;
  onSave: (annotations: TCustomPlaylistAnnotation[]) => Promise<TCustomPlaylistAnnotation[] | void>;
  onSeek?: (seconds: number) => void;
  playbackRate?: number;
  propertyHostElement?: HTMLElement | null;
  toolbarHostElement?: HTMLElement | null;
  showTimeline?: boolean;
  thumbnailUrl?: string | null;
  timelineHostElement?: HTMLElement | null;
};

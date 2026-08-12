import type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationPoint,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationTool,
} from "./annotation.types";

export type PlaylistAnnotationOverlayProps = {
  annotations: TCustomPlaylistAnnotation[];
  className?: string;
  color: string;
  durationSeconds: number;
  enableAnnotationTransforms?: boolean;
  enabled: boolean;
  fitToVideoBounds?: boolean;
  imageContent?: string | null;
  imageHeight: number;
  imageOpacity: number;
  imagePlacementKey?: number;
  imageTitle?: string;
  imageWidth: number;
  inputEnabled?: boolean;
  onCreateAnnotation: (annotation: TCustomPlaylistAnnotation) => void;
  onUpdateAnnotation?: (annotation: TCustomPlaylistAnnotation) => void;
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: number;
  startTime: number;
  strokeStyle: TCustomPlaylistAnnotationStrokeStyle;
  strokeWidth: number;
  tool: TCustomPlaylistAnnotationTool;
};

export type CanvasSize = {
  height: number;
  width: number;
};

export type AnnotationBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type AnnotationBoxResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export type AnnotationLinearResizeHandle = "start" | "end";

export type AnnotationResizeHandle = AnnotationBoxResizeHandle | AnnotationLinearResizeHandle;

export type AnnotationTransformMode = "move" | "resize" | "rotate";

export type AnnotationTransformState = {
  annotationId: string;
  center: TCustomPlaylistAnnotationPoint;
  mode: AnnotationTransformMode;
  originalAnnotation: TCustomPlaylistAnnotation;
  originalBounds: AnnotationBounds;
  originalRotation: number;
  pointerId: number;
  resizeHandle?: AnnotationResizeHandle;
  startAngle: number;
  startPoint: TCustomPlaylistAnnotationPoint;
};

export type OverlayBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type AnnotationResizeHandleOption = {
  className: string;
  cursorClassName: string;
  handle: AnnotationBoxResizeHandle;
  label: string;
};

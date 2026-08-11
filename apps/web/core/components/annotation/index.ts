export {
  PlaylistAnnotationOverlay,
  arePlaylistAnnotationsEqual,
  getActivePlaylistAnnotations,
  normalizePlaylistAnnotations,
} from "./components/playlist-annotation-overlay";
export { VideoAnnotationEditor } from "./components/video-annotation-editor";
export type {
  TCustomPlaylistAnnotation,
  TCustomPlaylistAnnotationPoint,
  TCustomPlaylistAnnotationStrokeStyle,
  TCustomPlaylistAnnotationStyle,
  TCustomPlaylistAnnotationTool,
} from "./types/annotation.types";
export {
  buildSgEventAnnotationDisplayMeta,
  buildSgEventAnnotationVideoItem,
  buildSgEventAnnotationViewKey,
  getSgEventMediaReferenceAnnotations,
} from "./utils/event-video-annotation";

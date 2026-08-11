import type {
  AnnotationBoxResizeHandle,
  AnnotationResizeHandle,
  AnnotationResizeHandleOption,
} from "../types/playlist-annotation-overlay.types";

export const ANNOTATION_RESIZE_HANDLES: AnnotationResizeHandleOption[] = [
  {
    className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    handle: "nw",
    label: "top left",
  },
  {
    className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    handle: "n",
    label: "top",
  },
  {
    className: "right-0 top-0 -translate-y-1/2 translate-x-1/2",
    cursorClassName: "cursor-nesw-resize",
    handle: "ne",
    label: "top right",
  },
  {
    className: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    handle: "e",
    label: "right",
  },
  {
    className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    handle: "se",
    label: "bottom right",
  },
  {
    className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    handle: "s",
    label: "bottom",
  },
  {
    className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nesw-resize",
    handle: "sw",
    label: "bottom left",
  },
  {
    className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-ew-resize",
    handle: "w",
    label: "left",
  },
];

export const OPPOSITE_RESIZE_HANDLE: Record<AnnotationBoxResizeHandle, AnnotationBoxResizeHandle> = {
  e: "w",
  n: "s",
  ne: "sw",
  nw: "se",
  s: "n",
  se: "nw",
  sw: "ne",
  w: "e",
};

export const isBoxResizeHandle = (handle: AnnotationResizeHandle): handle is AnnotationBoxResizeHandle =>
  handle !== "start" && handle !== "end";

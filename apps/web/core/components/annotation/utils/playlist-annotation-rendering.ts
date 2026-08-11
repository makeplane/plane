import type { TCustomPlaylistAnnotation, TCustomPlaylistAnnotationPoint } from "../types/annotation.types";
import type { CanvasSize, OverlayBounds } from "../types/playlist-annotation-overlay.types";
import {
  CANVAS_SIZE,
  MAX_ARROW_HEAD_LENGTH,
  MIN_ARROW_HEAD_LENGTH,
  clamp,
  getAnnotationCenter,
  getAnnotationRotation,
  getAnnotationStyle,
  getStrokeLineDash,
} from "./playlist-annotation-model";

const toCanvasX = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.width;

const toCanvasY = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.height;

const toCanvasPoint = (point: TCustomPlaylistAnnotationPoint, size: CanvasSize) => ({
  x: toCanvasX(point.x, size),
  y: toCanvasY(point.y, size),
});

const toCanvasWidth = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.width;

const toCanvasHeight = (value: number, size: CanvasSize) => (value / CANVAS_SIZE) * size.height;

export const getFittedVideoBounds = (root: HTMLElement): OverlayBounds | null => {
  const host = root.parentElement;
  const video = host?.querySelector<HTMLVideoElement>("video");
  if (!host || !video) return null;

  const hostRect = host.getBoundingClientRect();
  const videoRect = video.getBoundingClientRect();
  if (hostRect.width <= 0 || hostRect.height <= 0 || videoRect.width <= 0 || videoRect.height <= 0) return null;

  let left = videoRect.left - hostRect.left;
  let top = videoRect.top - hostRect.top;
  let width = videoRect.width;
  let height = videoRect.height;
  const videoAspectRatio = video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 0;
  const objectFit = typeof window !== "undefined" ? window.getComputedStyle(video).objectFit : "";

  if (videoAspectRatio > 0 && objectFit !== "fill") {
    const elementAspectRatio = videoRect.width / videoRect.height;

    if (objectFit === "cover") {
      if (elementAspectRatio > videoAspectRatio) {
        height = videoRect.width / videoAspectRatio;
        top = videoRect.top - hostRect.top - (height - videoRect.height) / 2;
      } else {
        width = videoRect.height * videoAspectRatio;
        left = videoRect.left - hostRect.left - (width - videoRect.width) / 2;
      }
    } else if (elementAspectRatio > videoAspectRatio) {
      width = videoRect.height * videoAspectRatio;
      left = videoRect.left - hostRect.left + (videoRect.width - width) / 2;
    } else {
      height = videoRect.width / videoAspectRatio;
      top = videoRect.top - hostRect.top + (videoRect.height - height) / 2;
    }
  }

  return {
    height: Math.max(1, height),
    left,
    top,
    width: Math.max(1, width),
  };
};

export const areOverlayBoundsEqual = (firstBounds: OverlayBounds | null, secondBounds: OverlayBounds | null) => {
  if (firstBounds === secondBounds) return true;
  if (!firstBounds || !secondBounds) return false;

  return (
    Math.abs(firstBounds.left - secondBounds.left) < 0.5 &&
    Math.abs(firstBounds.top - secondBounds.top) < 0.5 &&
    Math.abs(firstBounds.width - secondBounds.width) < 0.5 &&
    Math.abs(firstBounds.height - secondBounds.height) < 0.5
  );
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const resolvedRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);

  context.beginPath();
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - resolvedRadius, y + height);
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
  context.closePath();
};

const drawArrow = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  strokeWidth: number
) => {
  const length = Math.hypot(endX - startX, endY - startY);
  if (length <= 0) return;

  const directionX = (endX - startX) / length;
  const directionY = (endY - startY) / length;
  const headLength = Math.min(
    clamp(strokeWidth * 4.6, MIN_ARROW_HEAD_LENGTH, MAX_ARROW_HEAD_LENGTH),
    Math.max(MIN_ARROW_HEAD_LENGTH * 0.75, length * 0.45)
  );
  const headWidth = clamp(strokeWidth * 3.6, strokeWidth + 8, headLength * 0.9);
  const baseX = endX - directionX * headLength;
  const baseY = endY - directionY * headLength;
  const normalX = -directionY;
  const normalY = directionX;

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(baseX, baseY);
  context.stroke();

  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(baseX + normalX * (headWidth / 2), baseY + normalY * (headWidth / 2));
  context.lineTo(baseX - normalX * (headWidth / 2), baseY - normalY * (headWidth / 2));
  context.closePath();
  context.fill();
};

const drawImageAnnotation = ({
  annotation,
  context,
  imageCache,
  onImageLoad,
  size,
}: {
  annotation: TCustomPlaylistAnnotation;
  context: CanvasRenderingContext2D;
  imageCache: Map<string, HTMLImageElement>;
  onImageLoad: () => void;
  size: CanvasSize;
}) => {
  if (!annotation.content?.trim()) return;

  let image = imageCache.get(annotation.content);
  if (!image) {
    image = new Image();
    image.onload = onImageLoad;
    image.onerror = onImageLoad;
    image.src = annotation.content;
    imageCache.set(annotation.content, image);
  }

  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

  context.drawImage(
    image,
    toCanvasX(annotation.x, size),
    toCanvasY(annotation.y, size),
    toCanvasWidth(annotation.width || 120, size),
    toCanvasHeight(annotation.height || 120, size)
  );
};

export const drawCanvasAnnotation = ({
  annotation,
  context,
  imageCache,
  isDraft = false,
  onImageLoad,
  size,
}: {
  annotation: TCustomPlaylistAnnotation;
  context: CanvasRenderingContext2D;
  imageCache: Map<string, HTMLImageElement>;
  isDraft?: boolean;
  onImageLoad: () => void;
  size: CanvasSize;
}) => {
  const resolvedStyle = getAnnotationStyle(annotation);
  const rotation = getAnnotationRotation(annotation);
  const center = rotation ? getAnnotationCenter(annotation) : null;

  context.save();
  if (center) {
    context.translate(toCanvasX(center.x, size), toCanvasY(center.y, size));
    context.rotate((rotation * Math.PI) / 180);
    context.translate(-toCanvasX(center.x, size), -toCanvasY(center.y, size));
  }

  context.globalAlpha = (resolvedStyle.opacity ?? 1) * (isDraft ? 0.7 : 1);
  context.strokeStyle = resolvedStyle.stroke;
  context.fillStyle = resolvedStyle.stroke;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = resolvedStyle.strokeWidth;
  context.setLineDash(getStrokeLineDash(resolvedStyle.strokeStyle, resolvedStyle.strokeWidth));

  if (annotation.type === "pen") {
    const points = annotation.points ?? [];
    if (points.length < 2) {
      context.restore();
      return;
    }

    const firstPoint = toCanvasPoint(points[0], size);
    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);
    points.slice(1).forEach((point) => {
      const nextPoint = toCanvasPoint(point, size);
      context.lineTo(nextPoint.x, nextPoint.y);
    });
    context.stroke();
    context.restore();
    return;
  }

  if (annotation.type === "text") {
    const fontSize = Math.max(8, toCanvasHeight(resolvedStyle.fontSize, size));
    const fontWeight = resolvedStyle.fontWeight ? `${resolvedStyle.fontWeight} ` : "";
    context.fillStyle = resolvedStyle.fill;
    context.font = `${fontWeight}${fontSize}px ${resolvedStyle.fontFamily}`;
    context.textBaseline = "alphabetic";
    context.fillText(annotation.content ?? "", toCanvasX(annotation.x, size), toCanvasY(annotation.y, size));
    context.restore();
    return;
  }

  if (annotation.type === "image") {
    drawImageAnnotation({ annotation, context, imageCache, onImageLoad, size });
    context.restore();
    return;
  }

  if (annotation.type === "rectangle") {
    drawRoundedRect(
      context,
      toCanvasX(annotation.x, size),
      toCanvasY(annotation.y, size),
      toCanvasWidth(annotation.width ?? 0, size),
      toCanvasHeight(annotation.height ?? 0, size),
      6
    );
    context.stroke();
    context.restore();
    return;
  }

  if (annotation.type === "ellipse") {
    const width = toCanvasWidth(annotation.width ?? 0, size);
    const height = toCanvasHeight(annotation.height ?? 0, size);

    context.beginPath();
    context.ellipse(
      toCanvasX(annotation.x, size) + width / 2,
      toCanvasY(annotation.y, size) + height / 2,
      Math.abs(width) / 2,
      Math.abs(height) / 2,
      0,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.restore();
    return;
  }

  const startX = toCanvasX(annotation.x, size);
  const startY = toCanvasY(annotation.y, size);
  const endX = toCanvasX(annotation.x + (annotation.width ?? 0), size);
  const endY = toCanvasY(annotation.y + (annotation.height ?? 0), size);

  if (annotation.type === "arrow") {
    drawArrow(context, startX, startY, endX, endY, resolvedStyle.strokeWidth);
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  context.restore();
};

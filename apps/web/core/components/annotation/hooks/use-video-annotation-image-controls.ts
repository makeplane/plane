import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCustomPlaylistAnnotationTool } from "../types/annotation.types";
import {
  MAX_VIDEO_ANNOTATION_IMAGE_BYTES,
  VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS,
} from "../utils/video-annotation-editor-config";
import { clampTimelineValue } from "../utils/video-annotation-timeline";

type UseVideoAnnotationImageControlsParams = {
  onModeChange?: (enabled: boolean) => void;
  onRequestPause?: () => void;
  setAnnotationTool: Dispatch<SetStateAction<TCustomPlaylistAnnotationTool>>;
  setIsAnnotationMode: Dispatch<SetStateAction<boolean>>;
};

const DEFAULT_IMAGE_ANNOTATION_WIDTH = 180;
const DEFAULT_IMAGE_ANNOTATION_HEIGHT = 120;

const getImageAnnotationDefaultSize = (naturalWidth: number, naturalHeight: number) => {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
    return {
      height: DEFAULT_IMAGE_ANNOTATION_HEIGHT,
      width: DEFAULT_IMAGE_ANNOTATION_WIDTH,
    };
  }

  const aspectRatio = naturalWidth / naturalHeight;
  let width = DEFAULT_IMAGE_ANNOTATION_WIDTH;
  let height = Math.round(width / aspectRatio);

  if (height > DEFAULT_IMAGE_ANNOTATION_HEIGHT) {
    height = DEFAULT_IMAGE_ANNOTATION_HEIGHT;
    width = Math.round(height * aspectRatio);
  }

  const growScale = Math.max(
    VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min / Math.max(width, 1),
    VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min / Math.max(height, 1),
    1
  );
  width *= growScale;
  height *= growScale;

  const shrinkScale = Math.min(
    VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max / Math.max(width, 1),
    VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max / Math.max(height, 1),
    1
  );

  return {
    height: Math.round(height * shrinkScale),
    width: Math.round(width * shrinkScale),
  };
};

export const useVideoAnnotationImageControls = ({
  onModeChange,
  onRequestPause,
  setAnnotationTool,
  setIsAnnotationMode,
}: UseVideoAnnotationImageControlsParams) => {
  const [annotationImageContent, setAnnotationImageContent] = useState<string | null>(null);
  const [annotationImageHeight, setAnnotationImageHeight] = useState(DEFAULT_IMAGE_ANNOTATION_HEIGHT);
  const [annotationImageName, setAnnotationImageName] = useState("");
  const [annotationImageOpacity, setAnnotationImageOpacity] = useState(1);
  const [annotationImagePlacementKey, setAnnotationImagePlacementKey] = useState(0);
  const [annotationImageWidth, setAnnotationImageWidth] = useState(DEFAULT_IMAGE_ANNOTATION_WIDTH);
  const annotationImageInputRef = useRef<HTMLInputElement | null>(null);

  const handleChooseAnnotationImage = useCallback(() => {
    onRequestPause?.();
    annotationImageInputRef.current?.click();
  }, [onRequestPause]);

  const handleAnnotationImageChange = useCallback(
    (fileList: FileList | null) => {
      const selectedFile = fileList?.[0];
      if (!selectedFile) return;

      if (!selectedFile.type.startsWith("image/")) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Image annotation failed",
          message: "Choose a valid image file.",
        });
        return;
      }

      if (selectedFile.size > MAX_VIDEO_ANNOTATION_IMAGE_BYTES) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Image annotation failed",
          message: "Use an image smaller than 2 MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;

        const imageContent = reader.result;
        const image = new Image();
        image.onload = () => {
          const nextSize = getImageAnnotationDefaultSize(image.naturalWidth, image.naturalHeight);

          onRequestPause?.();
          setAnnotationImageContent(imageContent);
          setAnnotationImageHeight(nextSize.height);
          setAnnotationImageName(selectedFile.name);
          setAnnotationImagePlacementKey((currentValue) => currentValue + 1);
          setAnnotationImageWidth(nextSize.width);
          setAnnotationTool("image");
          setIsAnnotationMode(true);
          onModeChange?.(true);
        };
        image.onerror = () => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Image annotation failed",
            message: "Unable to load this image file.",
          });
        };
        image.src = imageContent;
      };
      reader.onerror = () => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Image annotation failed",
          message: "Unable to read this image file.",
        });
      };
      reader.readAsDataURL(selectedFile);
    },
    [onModeChange, onRequestPause, setAnnotationTool, setIsAnnotationMode]
  );

  const handleAnnotationImageSizeChange = useCallback((dimension: "height" | "width", value: string) => {
    const nextValue = Math.round(
      clampTimelineValue(Number(value), VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.min, VIDEO_ANNOTATION_IMAGE_SIZE_LIMITS.max)
    );

    if (dimension === "height") {
      setAnnotationImageHeight(nextValue);
      return;
    }

    setAnnotationImageWidth(nextValue);
  }, []);

  const handleAnnotationImageOpacityChange = useCallback((value: string) => {
    setAnnotationImageOpacity(clampTimelineValue(Number(value), 20, 100) / 100);
  }, []);

  return {
    annotationImageContent,
    annotationImageHeight,
    annotationImageInputRef,
    annotationImageName,
    annotationImageOpacity,
    annotationImagePlacementKey,
    annotationImageWidth,
    handleAnnotationImageChange,
    handleAnnotationImageOpacityChange,
    handleAnnotationImageSizeChange,
    handleChooseAnnotationImage,
  };
};

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

export const useVideoAnnotationImageControls = ({
  onModeChange,
  onRequestPause,
  setAnnotationTool,
  setIsAnnotationMode,
}: UseVideoAnnotationImageControlsParams) => {
  const [annotationImageContent, setAnnotationImageContent] = useState<string | null>(null);
  const [annotationImageHeight, setAnnotationImageHeight] = useState(120);
  const [annotationImageName, setAnnotationImageName] = useState("");
  const [annotationImageOpacity, setAnnotationImageOpacity] = useState(1);
  const [annotationImageWidth, setAnnotationImageWidth] = useState(180);
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

        onRequestPause?.();
        setAnnotationImageContent(reader.result);
        setAnnotationImageName(selectedFile.name);
        setAnnotationTool("image");
        setIsAnnotationMode(true);
        onModeChange?.(true);
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
    annotationImageWidth,
    handleAnnotationImageChange,
    handleAnnotationImageOpacityChange,
    handleAnnotationImageSizeChange,
    handleChooseAnnotationImage,
  };
};

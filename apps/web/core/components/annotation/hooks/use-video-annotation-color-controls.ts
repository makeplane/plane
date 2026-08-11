import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  getHexColorFromHsv,
  getHexColorFromRgb,
  getHsvFromRgb,
  getRgbFromHexColor,
  normalizeAnnotationHexColor,
} from "../utils/video-annotation-colors";
import { DEFAULT_VIDEO_ANNOTATION_COLOR } from "../utils/video-annotation-editor-config";
import { clampTimelineValue } from "../utils/video-annotation-timeline";

export const useVideoAnnotationColorControls = () => {
  const [annotationColor, setAnnotationColor] = useState(DEFAULT_VIDEO_ANNOTATION_COLOR);
  const [annotationColorInputValue, setAnnotationColorInputValue] = useState(DEFAULT_VIDEO_ANNOTATION_COLOR);
  const [isAnnotationColorPickerOpen, setIsAnnotationColorPickerOpen] = useState(false);
  const annotationColorRgb = getRgbFromHexColor(annotationColor);
  const annotationColorHsv = getHsvFromRgb(annotationColorRgb.red, annotationColorRgb.green, annotationColorRgb.blue);

  useEffect(() => {
    setAnnotationColorInputValue(annotationColor.toUpperCase());
  }, [annotationColor]);

  const handleAnnotationColorChange = (colorValue: string) => {
    const normalizedColor = normalizeAnnotationHexColor(colorValue);
    if (!normalizedColor) return;

    setAnnotationColor(normalizedColor);
    setAnnotationColorInputValue(normalizedColor.toUpperCase());
  };

  const handleAnnotationColorInputChange = (colorValue: string) => {
    setAnnotationColorInputValue(colorValue.toUpperCase());

    const normalizedColor = normalizeAnnotationHexColor(colorValue);
    if (normalizedColor) setAnnotationColor(normalizedColor);
  };

  const handleAnnotationColorInputBlur = () => {
    setAnnotationColorInputValue(annotationColor.toUpperCase());
  };

  const handleAnnotationColorChannelChange = (channel: "blue" | "green" | "red", colorValue: string) => {
    const channelValue = clampTimelineValue(Number(colorValue), 0, 255);
    const nextColor = {
      ...annotationColorRgb,
      [channel]: channelValue,
    };

    handleAnnotationColorChange(getHexColorFromRgb(nextColor.red, nextColor.green, nextColor.blue));
  };

  const handleAnnotationColorHueChange = (hueValue: string) => {
    const nextHue = clampTimelineValue(Number(hueValue), 0, 360);
    handleAnnotationColorChange(getHexColorFromHsv(nextHue, annotationColorHsv.saturation, annotationColorHsv.value));
  };

  const updateAnnotationColorFromPickerPoint = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pickerRect = event.currentTarget.getBoundingClientRect();
    const saturation = clampTimelineValue((event.clientX - pickerRect.left) / pickerRect.width, 0, 1);
    const value = 1 - clampTimelineValue((event.clientY - pickerRect.top) / pickerRect.height, 0, 1);

    handleAnnotationColorChange(getHexColorFromHsv(annotationColorHsv.hue, saturation, value));
  };

  const handleAnnotationColorPickerPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateAnnotationColorFromPickerPoint(event);
  };

  const handleAnnotationColorPickerPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.buttons !== 1) return;
    updateAnnotationColorFromPickerPoint(event);
  };

  return {
    annotationColor,
    annotationColorHsv,
    annotationColorInputValue,
    annotationColorRgb,
    handleAnnotationColorChange,
    handleAnnotationColorChannelChange,
    handleAnnotationColorHueChange,
    handleAnnotationColorInputBlur,
    handleAnnotationColorInputChange,
    handleAnnotationColorPickerPointerDown,
    handleAnnotationColorPickerPointerMove,
    isAnnotationColorPickerOpen,
    setIsAnnotationColorPickerOpen,
  };
};

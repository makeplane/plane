"use client";

type VideoAnnotationColorPickerButtonProps = {
  annotationColor: string;
  onColorChange: (colorValue: string) => void;
};

export const VideoAnnotationColorPickerButton = ({
  annotationColor,
  onColorChange,
}: VideoAnnotationColorPickerButtonProps) => (
  <label
    className="relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-custom-border-200 bg-custom-background-90 transition-colors hover:bg-custom-background-80 focus-within:ring-2 focus-within:ring-custom-primary-100/40"
    title={`Pick annotation color (${annotationColor.toUpperCase()})`}
  >
    <span
      className="h-4 w-4 rounded-full border border-custom-border-200 shadow-sm"
      style={{ backgroundColor: annotationColor }}
    />
    <input
      type="color"
      value={annotationColor}
      onChange={(event) => onColorChange(event.currentTarget.value)}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      aria-label="Pick annotation color"
    />
  </label>
);

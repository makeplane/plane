"use client";

import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  Ref,
  SetStateAction,
} from "react";
import type { TCustomPlaylistAnnotationPoint } from "../types/annotation.types";
import { clamp } from "../utils/playlist-annotation-model";

type PlaylistAnnotationTextDraft = {
  point: TCustomPlaylistAnnotationPoint;
  value: string;
};

type PlaylistAnnotationTextDraftInputProps = {
  color: string;
  enabled: boolean;
  inputRef: Ref<HTMLInputElement>;
  onBlur: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  onTextDraftChange: Dispatch<SetStateAction<PlaylistAnnotationTextDraft | null>>;
  onPointerDown: (event: ReactPointerEvent<HTMLInputElement>) => void;
  textDraft: PlaylistAnnotationTextDraft | null;
  textFontFamily: string;
  textFontSize: number;
  textFontWeight: number;
};

export const PlaylistAnnotationTextDraftInput = ({
  color,
  enabled,
  inputRef,
  onBlur,
  onKeyDown,
  onPointerDown,
  onTextDraftChange,
  textDraft,
  textFontFamily,
  textFontSize,
  textFontWeight,
}: PlaylistAnnotationTextDraftInputProps) => {
  if (!enabled || !textDraft) return null;

  return (
    <input
      ref={inputRef}
      type="text"
      value={textDraft.value}
      onBlur={onBlur}
      onChange={(event) =>
        onTextDraftChange((currentValue) => currentValue && { ...currentValue, value: event.target.value })
      }
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      className="absolute z-20 h-8 min-w-36 max-w-60 rounded-[4px] border border-custom-border-200 bg-custom-background-100 px-2 text-[14px] font-semibold shadow-lg outline-none ring-2 ring-custom-primary-100/35 placeholder:text-custom-text-400"
      placeholder="Text"
      style={{
        color,
        fontFamily: textFontFamily,
        fontSize: `${clamp(textFontSize, 12, 32)}px`,
        fontWeight: textFontWeight,
        left: `${textDraft.point.x / 10}%`,
        top: `${textDraft.point.y / 10}%`,
        transform: "translateY(-50%)",
      }}
    />
  );
};
